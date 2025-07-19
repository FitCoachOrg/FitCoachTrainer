// Cerebras AI Service
// Alternative to OpenRouter for AI model interactions

export interface CerebrasResponse {
  response: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw?: any;
}

export async function askCerebras(prompt: string, model?: string): Promise<{ response: string, model: string, usage?: any, raw?: any, fallbackModelUsed?: boolean }> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  console.log('🤖 Starting Cerebras AI request...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('📊 Estimated prompt tokens:', Math.ceil(prompt.length / 4));

  const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY as string;
  if (!CEREBRAS_API_KEY) {
    throw new Error('Cerebras API key not found. Please add VITE_CEREBRAS_API_KEY to your .env file');
  }

  try {
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏰ Timeout for Cerebras API request');
    }, 180000); // 3 minute timeout

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'qwen-3-32b',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 25000,
        temperature: 0.3,
        top_p: 0.9,
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cerebras API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('🔍 Raw Cerebras response received');

    if (!responseText.trim()) {
      throw new Error('Cerebras returned empty response');
    }

    let json;
    try {
      json = JSON.parse(responseText);
      console.log('✅ Successfully parsed original JSON response');
    } catch (err) {
      console.error('❌ Invalid JSON response from Cerebras');
      console.error('🔍 Raw response length:', responseText.length);
      console.error('🔍 Raw response (first 500 chars):', responseText.substring(0, 500));
      console.error('🔍 Raw response (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
      console.error('🔍 Original JSON parse error:', (err as any).message);
      
      // Try to clean the response by removing thinking tokens and other non-JSON content
      let cleanedResponse = responseText;
      
      console.log('🔧 Starting response cleaning process...');
      
      // Remove thinking tokens and similar patterns
      const beforeThinkRemoval = cleanedResponse;
      cleanedResponse = cleanedResponse.replace(/<think>.*?<\/think>/g, '');
      cleanedResponse = cleanedResponse.replace(/<thinking>.*?<\/thinking>/g, '');
      cleanedResponse = cleanedResponse.replace(/<reasoning>.*?<\/reasoning>/g, '');
      cleanedResponse = cleanedResponse.replace(/<process>.*?<\/process>/g, '');
      
      if (beforeThinkRemoval !== cleanedResponse) {
        console.log('🔧 Removed thinking tokens from response');
      }
      
      // Remove any content before the first {
      const firstBraceIndex = cleanedResponse.indexOf('{');
      if (firstBraceIndex > 0) {
        console.log('🔧 Removing content before first { (index:', firstBraceIndex, ')');
        cleanedResponse = cleanedResponse.substring(firstBraceIndex);
      }
      
      // Remove any content after the last }
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex > 0 && lastBraceIndex < cleanedResponse.length - 1) {
        console.log('🔧 Removing content after last } (index:', lastBraceIndex, ')');
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
      }
      
      console.log('🔧 Cleaned response length:', cleanedResponse.length);
      console.log('🔧 Cleaned response (first 500 chars):', cleanedResponse.substring(0, 500));
      console.log('🔧 Cleaned response (last 500 chars):', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 500)));
      
      try {
        json = JSON.parse(cleanedResponse);
        console.log('✅ Successfully parsed cleaned JSON response');
      } catch (cleanErr) {
        console.error('❌ Still invalid JSON after cleaning');
        console.error('🔍 Cleaned response parse error:', (cleanErr as any).message);
        console.error('🔍 Full cleaned response for debugging:');
        console.error(cleanedResponse);
        throw new Error('Invalid JSON response from Cerebras after cleaning: ' + ((err as any).message));
      }
    }

    if (!json.choices || !json.choices[0] || !json.choices[0].message) {
      console.error('Cerebras response missing expected fields:', json);
      throw new Error('Cerebras response missing required fields (choices or message)');
    }

    const responseContent = json.choices[0].message.content;
    console.log('✅ Cerebras model successful');
    console.log('📊 Response length:', responseContent.length, 'characters');
    console.log('📊 Estimated response tokens:', Math.ceil(responseContent.length / 4));
    if (json.usage) {
      console.log('📊 Actual token usage:', json.usage);
    }

    clearTimeout(timeoutId);
    return {
      response: responseContent,
      model: json.model || model || 'qwen-3-32b',
      usage: json.usage,
      raw: json,
      fallbackModelUsed: false,
    };

  } catch (err) {
    console.error('❌ Cerebras API request failed:', (err as any).message);
    throw new Error(`Cerebras API request failed: ${(err as any).message}`);
  }
} 