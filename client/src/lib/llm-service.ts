// Unified LLM Service
// Handles switching between different LLM providers (Local, OpenRouter, Cerebras)

export interface LLMResponse {
  response: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  raw?: any;
  fallbackModelUsed?: boolean;
}

export type LLMProvider = 'local' | 'openrouter' | 'cerebras'

interface LLMConfig {
  provider: LLMProvider;
  name: string;
  defaultModel: string;
  apiKeyEnv: string;
  baseUrl?: string;
}

const LLM_CONFIGS: Record<LLMProvider, LLMConfig> = {
  local: {
    provider: 'local',
    name: 'Local LLM',
    defaultModel: 'qwen2.5:latest',
    apiKeyEnv: 'VITE_OLLAMA_URL',
    baseUrl: 'http://localhost:11434'
  },
  openrouter: {
    provider: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'qwen/qwen-32b:free',
    apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1'
  },
  cerebras: {
    provider: 'cerebras',
    name: 'Cerebras',
    defaultModel: 'llama3.1-8b',
    apiKeyEnv: 'VITE_CEREBRAS_API_KEY',
    baseUrl: 'https://api.cerebras.ai/v1'
  }
}

// Get the currently selected provider from localStorage
export const getCurrentProvider = (): LLMProvider => {
  const saved = localStorage.getItem('selectedLLMProvider')
  const provider = (saved as LLMProvider) || 'cerebras' // Default to cerebras
  console.log(`🔍 DEBUG: localStorage value: "${saved}"`)
  console.log(`🔍 DEBUG: Selected provider: "${provider}"`)
  return provider
}

// Set the current provider
export const setCurrentProvider = (provider: LLMProvider): void => {
  localStorage.setItem('selectedLLMProvider', provider)
}

// Get the current provider configuration
export const getCurrentProviderConfig = (): LLMConfig => {
  const provider = getCurrentProvider()
  return LLM_CONFIGS[provider]
}

// Get the currently selected model
export const getCurrentModel = (): string => {
  const saved = localStorage.getItem('selectedLLMModel')
  const provider = getCurrentProvider()
  const config = LLM_CONFIGS[provider]
  return saved || config.defaultModel
}

// Main function to ask any LLM provider
export async function askLLM(prompt: string, model?: string): Promise<LLMResponse> {
  const provider = getCurrentProvider()
  const config = LLM_CONFIGS[provider]
  const selectedModel = getCurrentModel()
  
  console.log(`🔍 DEBUG: Current provider: ${provider}`)
  console.log(`🔍 DEBUG: Provider config:`, config)
  console.log(`🔍 DEBUG: Model parameter: ${model}`)
  console.log(`🔍 DEBUG: Selected model from localStorage: ${selectedModel}`)
  console.log(`🤖 Using ${config.name} provider with model: ${model || selectedModel}`)
  
  switch (provider) {
    case 'local':
      return await askLocalLLM(prompt, model || selectedModel)
    case 'openrouter':
      return await askOpenRouter(prompt, model || selectedModel)
    case 'cerebras':
      return await askCerebras(prompt, model || selectedModel)
    default:
      throw new Error(`Unknown LLM provider: ${provider}`)
  }
}

// Local LLM (Ollama) implementation
async function askLocalLLM(prompt: string, model?: string): Promise<LLMResponse> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  const config = LLM_CONFIGS.local;
  const modelToUse = model || config.defaultModel;

  console.log('🤖 Starting Local LLM (Ollama) request...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('🤖 Using model:', modelToUse);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏰ Timeout for Local LLM request');
    }, 180000); // 3 minute timeout

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        prompt,
        stream: false,
        options: {
          num_predict: 32000,
          temperature: 0.3,
          top_p: 0.9,
          repeat_penalty: 1.1,
          top_k: 40,
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Local LLM API error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('🔍 Raw Local LLM response received');

    let json;
    try {
      json = JSON.parse(responseText);
    } catch (err) {
      console.error('❌ Invalid JSON response from Local LLM:', responseText.substring(0, 200));
      throw new Error('Invalid JSON response from Local LLM: ' + ((err as any).message));
    }

    if (!json.response) {
      throw new Error('Local LLM response missing required field (response)');
    }

    console.log('✅ Local LLM successful');
    console.log('📊 Response length:', json.response.length, 'characters');

    clearTimeout(timeoutId);
    return {
      response: json.response,
      model: modelToUse,
      usage: undefined,
      raw: json,
      fallbackModelUsed: false,
    };

  } catch (err) {
    console.error('❌ Local LLM API request failed:', (err as any).message);
    throw new Error(`Local LLM API request failed: ${(err as any).message}`);
  }
}

// OpenRouter implementation
async function askOpenRouter(prompt: string, model?: string): Promise<LLMResponse> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  const config = LLM_CONFIGS.openrouter;
  const modelToUse = model || config.defaultModel;

  console.log('🤖 Starting OpenRouter request...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('🤖 Using model:', modelToUse);

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to your .env file');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏰ Timeout for OpenRouter request');
    }, 180000); // 3 minute timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 32000,
        temperature: 0.3,
        top_p: 0.9,
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('🔍 Raw OpenRouter response received');

    if (!responseText.trim()) {
      throw new Error('OpenRouter returned empty response');
    }

    let json;
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
    console.log('✅ OpenRouter successful');
    console.log('📊 Response length:', responseContent.length, 'characters');

    clearTimeout(timeoutId);
    return {
      response: responseContent,
      model: json.model || modelToUse,
      usage: json.usage,
      raw: json,
      fallbackModelUsed: false,
    };

  } catch (err) {
    console.error('❌ OpenRouter API request failed:', (err as any).message);
    throw new Error(`OpenRouter API request failed: ${(err as any).message}`);
  }
}

// Cerebras implementation
async function askCerebras(prompt: string, model?: string): Promise<LLMResponse> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  const config = LLM_CONFIGS.cerebras;
  const modelToUse = model || config.defaultModel;

  console.log('🤖 Starting Cerebras AI request...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('🤖 Using model:', modelToUse);

  const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY as string;
  if (!CEREBRAS_API_KEY) {
    throw new Error('Cerebras API key not found. Please add VITE_CEREBRAS_API_KEY to your .env file');
  }

  try {
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
        model: modelToUse,
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 32000,
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
    } catch (err) {
      console.error('❌ Invalid JSON response from Cerebras:', responseText.substring(0, 200));
      
      // Try to clean the response by removing thinking tokens and other non-JSON content
      let cleanedResponse = responseText;
      
      // Remove thinking tokens and similar patterns
      cleanedResponse = cleanedResponse.replace(/<think>.*?<\/think>/g, '');
      cleanedResponse = cleanedResponse.replace(/<thinking>.*?<\/thinking>/g, '');
      cleanedResponse = cleanedResponse.replace(/<reasoning>.*?<\/reasoning>/g, '');
      cleanedResponse = cleanedResponse.replace(/<process>.*?<\/process>/g, '');
      
      // Remove any standalone thinking tokens that might not be properly closed
      cleanedResponse = cleanedResponse.replace(/<think>.*?(?=\n|$)/g, '');
      cleanedResponse = cleanedResponse.replace(/<thinking>.*?(?=\n|$)/g, '');
      cleanedResponse = cleanedResponse.replace(/<reasoning>.*?(?=\n|$)/g, '');
      cleanedResponse = cleanedResponse.replace(/<process>.*?(?=\n|$)/g, '');
      
      // Remove any content before the first {
      const firstBraceIndex = cleanedResponse.indexOf('{');
      if (firstBraceIndex > 0) {
        cleanedResponse = cleanedResponse.substring(firstBraceIndex);
      }
      
      // Remove any content after the last }
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex > 0 && lastBraceIndex < cleanedResponse.length - 1) {
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
      }
      
      console.log('🔧 Attempting to clean response and parse JSON...');
      console.log('🔧 Cleaned response preview:', cleanedResponse.substring(0, 200));
      
      try {
        json = JSON.parse(cleanedResponse);
        console.log('✅ Successfully parsed cleaned JSON response');
      } catch (cleanErr) {
        console.error('❌ Still invalid JSON after cleaning:', cleanErr);
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

    clearTimeout(timeoutId);
    return {
      response: responseContent,
      model: json.model || modelToUse,
      usage: json.usage,
      raw: json,
      fallbackModelUsed: false,
    };

  } catch (err) {
    console.error('❌ Cerebras API request failed:', (err as any).message);
    throw new Error(`Cerebras API request failed: ${(err as any).message}`);
  }
} 