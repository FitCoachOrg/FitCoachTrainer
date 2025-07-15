const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
const YOUR_SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:8080";
const YOUR_SITE_NAME = "FitCoachTrainer";

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

export async function askOpenRouter(prompt: string): Promise<OpenRouterResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("VITE_OPENROUTER_API_KEY is not set in the environment variables.");
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  console.log('🤖 Calling OpenRouter API with model: qwen/qwen3-32b:free');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': YOUR_SITE_URL,
        'X-Title': YOUR_SITE_NAME,
      },
              body: JSON.stringify({
          model: "qwen/qwen3-8b:free", // Using a more reliable model
          messages: [
            { role: "user", content: prompt }
          ]
        }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Log response details for debugging
    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('OpenRouter raw response:', responseText);

    if (!responseText) {
      throw new Error('OpenRouter returned empty response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('Failed to parse OpenRouter response as JSON:', parseError);
      console.error('Response text was:', responseText);
      throw new Error(`Invalid JSON response from OpenRouter: ${parseError.message || 'Unknown parse error'}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('OpenRouter response missing expected fields:', data);
      throw new Error('OpenRouter response missing required fields (choices or message)');
    }

    return {
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      raw: data
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Error calling OpenRouter API:", error);
    throw new Error(error.message || "An unknown error occurred while contacting OpenRouter.");
  }
} 