"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Settings, 
  Bot, 
  Server, 
  Globe,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { setCurrentProvider } from '@/lib/llm-service'

type LLMProvider = 'local' | 'openrouter' | 'cerebras'

interface LLMConfig {
  provider: LLMProvider
  name: string
  description: string
  defaultModel: string
  availableModels: string[]
  apiKeyEnv: string
  baseUrl?: string
  icon: React.ReactNode
  status: 'available' | 'unavailable' | 'checking'
}

const Admin = () => {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(() => {
    // Initialize from localStorage or default to cerebras
    const saved = localStorage.getItem('selectedLLMProvider')
    return (saved as LLMProvider) || 'cerebras'
  })
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Initialize from localStorage or use default for selected provider
    const saved = localStorage.getItem('selectedLLMModel')
    return saved || 'llama3.1-8b' // Default to cerebras default model
  })
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([
    {
      provider: 'local',
      name: 'Local LLM',
      description: 'Run AI models locally using Ollama',
      defaultModel: 'qwen2.5:latest',
      availableModels: ['qwen2.5:latest', 'qwen2.5-vl-72b-instruct', 'qwen2.5-vl-32b-instruct'],
      apiKeyEnv: 'VITE_OLLAMA_URL',
      baseUrl: 'http://localhost:11434',
      icon: <Server className="h-5 w-5" />,
      status: 'checking'
    },
    {
      provider: 'openrouter',
      name: 'OpenRouter',
      description: 'Access multiple AI models through OpenRouter',
      defaultModel: 'qwen/qwen-32b:free',
      availableModels: ['qwen/qwen-32b:free', 'qwen/qwen-72b:free', 'meta-llama/llama-3.1-8b-instruct:free'],
      apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
      baseUrl: 'https://openrouter.ai/api/v1',
      icon: <Globe className="h-5 w-5" />,
      status: 'checking'
    },
    {
      provider: 'cerebras',
      name: 'Cerebras',
      description: 'Use Cerebras AI models',
      defaultModel: 'llama3.1-8b',
      availableModels: ['llama3.1-8b', 'llama-4-scout-17b-16e-instruct'],
      apiKeyEnv: 'VITE_CEREBRAS_API_KEY',
      baseUrl: 'https://api.cerebras.ai/v1',
      icon: <Bot className="h-5 w-5" />,
      status: 'checking'
    }
  ])

  // Check availability of each provider
  useEffect(() => {
    checkProviderAvailability()
  }, [])

  const checkProviderAvailability = async () => {
    const updatedConfigs = await Promise.all(
      llmConfigs.map(async (config) => {
        let status: 'available' | 'unavailable' = 'unavailable'
        
        try {
          // Check if API key exists
          const apiKey = import.meta.env[config.apiKeyEnv]
          if (!apiKey) {
            return { ...config, status: 'unavailable' as const }
          }

          // For local LLM, check if Ollama is running
          if (config.provider === 'local') {
            try {
              const response = await fetch(`${config.baseUrl}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              })
              status = response.ok ? 'available' : 'unavailable'
            } catch {
              status = 'unavailable'
            }
          } else {
            // For remote providers, just check if API key exists
            status = 'available'
          }
        } catch {
          status = 'unavailable'
        }

        return { ...config, status }
      })
    )

    setLlmConfigs(updatedConfigs)
  }

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider)
    
    // Update model to default for the new provider
    const newConfig = llmConfigs.find(c => c.provider === provider)
    if (newConfig) {
      setSelectedModel(newConfig.defaultModel)
      localStorage.setItem('selectedLLMModel', newConfig.defaultModel)
    }
    
    // Save to localStorage for persistence
    setCurrentProvider(provider)
    
    toast({
      title: "LLM Provider Updated",
      description: `Switched to ${newConfig?.name} with model ${newConfig?.defaultModel}`,
    })
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem('selectedLLMModel', model)
    
    toast({
      title: "LLM Model Updated",
      description: `Switched to model: ${model}`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'unavailable':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'checking':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'unavailable':
        return 'Unavailable'
      case 'checking':
        return 'Checking...'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'checking':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure LLM providers and system settings
          </p>
        </div>
      </div>

      {/* LLM Provider Selection */}
      <Card className="bg-white/95 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <Bot className="h-5 w-5 text-purple-500" />
            LLM Provider Configuration
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select which AI provider to use for generating nutrition plans, fitness programs, and other AI features.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selector */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active LLM Provider
              </label>
              <Select value={selectedProvider} onValueChange={(value: LLMProvider) => handleProviderChange(value)}>
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmConfigs.map((config) => (
                    <SelectItem key={config.provider} value={config.provider}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{config.name}</span>
                        <Badge className={`ml-auto ${getStatusColor(config.status)}`}>
                          {getStatusText(config.status)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Model Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active LLM Model
              </label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmConfigs.find(c => c.provider === selectedProvider)?.availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{model}</span>
                        {model === llmConfigs.find(c => c.provider === selectedProvider)?.defaultModel && (
                          <Badge className="ml-auto bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Provider Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {llmConfigs.map((config) => (
              <Card 
                key={config.provider}
                className={`p-4 transition-all duration-200 ${
                  selectedProvider === config.provider 
                    ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {config.name}
                    </h3>
                  </div>
                  {getStatusIcon(config.status)}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {config.description}
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Default Model:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {config.defaultModel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Key:</span>
                    <span className={`font-mono ${
                      import.meta.env[config.apiKeyEnv] ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {import.meta.env[config.apiKeyEnv] ? '✓ Set' : '✗ Missing'}
                    </span>
                  </div>
                  {config.baseUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base URL:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                        {config.baseUrl}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Current Selection Info */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Info className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Current Configuration
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Active Provider:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {llmConfigs.find(c => c.provider === selectedProvider)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Selected Model:</span>
                  <span className="font-mono text-blue-900 dark:text-blue-100">
                    {selectedModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Status:</span>
                  <Badge className={getStatusColor(llmConfigs.find(c => c.provider === selectedProvider)?.status || 'unknown')}>
                    {getStatusText(llmConfigs.find(c => c.provider === selectedProvider)?.status || 'unknown')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default Admin 