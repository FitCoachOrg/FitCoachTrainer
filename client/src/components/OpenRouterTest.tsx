"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { askOpenRouter } from '@/lib/open-router-service';
import { Bot } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
);

const OpenRouterTest = () => {
  const [prompt, setPrompt] = useState('What are the top 5 high-protein vegan breakfast options?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await askOpenRouter(prompt);
      setResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/95 dark:bg-gray-900/90 border-0 shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <Bot className="h-6 w-6 text-cyan-500" />
          OpenRouter AI Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="prompt-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter your question:
          </label>
          <Textarea
            id="prompt-textarea"
            placeholder="e.g., What is the meaning of life?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full"
            rows={4}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span className="ml-2">Asking AI...</span>
            </>
          ) : (
            'Send to OpenRouter'
          )}
        </Button>
        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-500/10 rounded-md">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        {response && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">AI Response:</h4>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
              {response}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenRouterTest; 