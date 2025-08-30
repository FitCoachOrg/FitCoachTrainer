const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
const YOUR_SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:8080";
const YOUR_SITE_NAME = "CoachEZ";

export interface OpenRouterResponse {
  response: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw?: any;
}

export async function askOpenRouter(prompt: string, model?: string): Promise<{ response: string, model: string, usage?: any, raw?: any, fallbackModelUsed?: boolean }> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  console.log('🤖 Starting AI model fallback chain...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('📊 Estimated prompt tokens:', Math.ceil(prompt.length / 4));

  // Define model fallback chain with priorities
  const modelsToTry = [
    { name: 'qwen2.5:latest', type: 'local', priority: 1 },
    { name: 'shisa-ai/shisa-v2-llama3.3-70b', type: 'openrouter', priority: 2 },
    { name: 'qwen2.5-vl-32b-instruct', type: 'openrouter', priority: 3 },
  ];

  let lastError = null;
  let attemptCount = 0;

  for (const modelConfig of modelsToTry) {
    attemptCount++;
    const { name: tryModel, type: modelType, priority } = modelConfig;
    
    console.log(`🔄 Attempt ${attemptCount}: Trying ${modelType} model "${tryModel}" (Priority ${priority})`);
    
    try {
      // Set timeout for each attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏰ Timeout for model ${tryModel}`);
      }, 180000); // 3 minute timeout per model

      let responseText = '';
      let json: any;

      if (modelType === 'local') {
        // Check if Ollama is available
        try {
          const healthCheck = await fetch('http://localhost:11434/api/tags', { 
            method: 'GET',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!healthCheck.ok) {
            throw new Error('Ollama service not available');
          }
          
          console.log('✅ Ollama service is available, proceeding...');
        } catch (healthError) {
          console.warn('⚠️ Ollama service not available, skipping to next model');
          throw new Error('Ollama service unavailable');
        }

        // Use Ollama local API
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: tryModel,
            prompt,
            stream: false,
            options: {
              num_predict: 25000,
              temperature: 0.3,
              top_p: 0.9,
              repeat_penalty: 1.1,
              top_k: 40,
            }
          }),
          signal: controller.signal
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
        }

        responseText = await ollamaResponse.text();
        console.log('🔍 Raw Ollama response received');

        try {
          json = JSON.parse(responseText);
        } catch (err) {
          console.error('❌ Invalid JSON response from Ollama:', responseText.substring(0, 200));
          throw new Error('Invalid JSON response from Ollama: ' + ((err as any).message));
        }

        if (!json.response) {
          throw new Error('Ollama response missing required field (response)');
        }

        console.log('✅ Ollama model successful');
        console.log('📊 Ollama response length:', json.response.length, 'characters');
        console.log('📊 Estimated Ollama response tokens:', Math.ceil(json.response.length / 4));

        clearTimeout(timeoutId);
        return {
          response: json.response,
          model: tryModel,
          usage: undefined,
          raw: json,
          fallbackModelUsed: priority > 1,
        };

      } else {
        // Use OpenRouter API
        if (!OPENROUTER_API_KEY) {
          console.warn('⚠️ OpenRouter API key not available, skipping OpenRouter models');
          continue;
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: tryModel,
            messages: [
              { role: 'user', content: prompt },
            ],
            max_tokens: 25000,
            temperature: 0.3,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        responseText = await response.text();
        console.log('🔍 Raw OpenRouter response received');

        if (!responseText.trim()) {
          throw new Error('OpenRouter returned empty response');
        }

        try {
          json = JSON.parse(responseText);
        } catch (err) {
          console.error('❌ Invalid JSON response from OpenRouter:', responseText.substring(0, 200));
          throw new Error('Invalid JSON response from OpenRouter: ' + ((err as any).message));
        }

        if (!json.choices || !json.choices[0] || !json.choices[0].message) {
          console.error('OpenRouter response missing expected fields:', json);
          throw new Error('OpenRouter response missing required fields (choices or message)');
        }

        const responseContent = json.choices[0].message.content;
        console.log('✅ OpenRouter model successful');
        console.log('📊 Response length:', responseContent.length, 'characters');
        console.log('📊 Estimated response tokens:', Math.ceil(responseContent.length / 4));
        if (json.usage) {
          console.log('📊 Actual token usage:', json.usage);
        }

        clearTimeout(timeoutId);
        return {
          response: responseContent,
          model: json.model || tryModel,
          usage: json.usage,
          raw: json,
          fallbackModelUsed: priority > 1,
        };
      }

    } catch (err) {
      lastError = err;
      console.warn(`❌ Model ${tryModel} failed:`, (err as any).message);
      
      // If this was the last model, throw the error
      if (attemptCount === modelsToTry.length) {
        console.error('💥 All models failed. Final error:', (err as any).message);
        throw new Error(`All models failed. Last error: ${(err as any).message}`);
      }
      
      console.log(`🔄 Continuing to next model... (${attemptCount}/${modelsToTry.length})`);
    }
  }

  throw new Error('All models failed. Last error: ' + ((lastError as any)?.message || lastError));
} 