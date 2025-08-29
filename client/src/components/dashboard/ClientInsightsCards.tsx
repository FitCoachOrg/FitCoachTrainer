import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Target, Activity, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react'

// Types
interface ClientInsight {
  client_id: number
  client_name: string
  value: number
}

type Trend = 'up' | 'down' | 'stable'

interface InsightsData {
  momentum: {
    average: number
    topPerformers: ClientInsight[]
    bottomPerformers: ClientInsight[]
    trend: Trend
  }
  adherence: {
    average: number
    topPerformers: ClientInsight[]
    bottomPerformers: ClientInsight[]
    trend: Trend
  }
  engagement: {
    average: number
    topPerformers: ClientInsight[]
    bottomPerformers: ClientInsight[]
    trend: Trend
  }
}

// Static mock data (no fetching, no loading state)
const MOCK_INSIGHTS: InsightsData = {
  momentum: {
    average: 12.5,
    topPerformers: [
      { client_id: 1, client_name: 'John Doe', value: 25.0 },
      { client_id: 2, client_name: 'Jane Smith', value: 18.3 },
      { client_id: 3, client_name: 'Mike Johnson', value: 15.7 },
    ],
    bottomPerformers: [
      { client_id: 4, client_name: 'Sarah Wilson', value: -8.2 },
      { client_id: 5, client_name: 'Tom Brown', value: -12.1 },
      { client_id: 6, client_name: 'Lisa Davis', value: -15.5 },
    ],
    trend: 'up',
  },
  adherence: {
    average: 78.5,
    topPerformers: [
      { client_id: 7, client_name: 'Chris Lee', value: 95.2 },
      { client_id: 8, client_name: 'Emma Davis', value: 92.8 },
      { client_id: 9, client_name: 'Alex Kim', value: 89.1 },
    ],
    bottomPerformers: [
      { client_id: 10, client_name: 'Taylor Hall', value: 45.3 },
      { client_id: 11, client_name: 'Jordan Park', value: 38.7 },
      { client_id: 12, client_name: 'Sam Carter', value: 32.1 },
    ],
    trend: 'stable',
  },
  engagement: {
    average: 72.3,
    topPerformers: [
      { client_id: 13, client_name: 'Nina Patel', value: 89.5 },
      { client_id: 14, client_name: 'Omar Khan', value: 85.2 },
      { client_id: 15, client_name: 'Rita Gomez', value: 81.7 },
    ],
    bottomPerformers: [
      { client_id: 16, client_name: 'Paul Young', value: 42.3 },
      { client_id: 17, client_name: 'Ivy Chen', value: 38.9 },
      { client_id: 18, client_name: 'Ben Turner', value: 35.1 },
    ],
    trend: 'stable',
  },
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') return <TrendingUp className="h-5 w-5 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-5 w-5 text-red-500" />
  return <Minus className="h-5 w-5 text-gray-500" />
}

function trendBadgeClass(trend: Trend): string {
  if (trend === 'up') return 'text-green-600 bg-green-100 dark:bg-green-900/20'
  if (trend === 'down') return 'text-red-600 bg-red-100 dark:bg-red-900/20'
  return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
}

export function ClientInsightsCards() {
  console.log('[ClientInsightsCards] mounted/render')
  // Local UI-only state for flips (no effects, no re-fetch)
  const [isMomentumFlipped, setIsMomentumFlipped] = useState(false)
  const [isAdherenceFlipped, setIsAdherenceFlipped] = useState(false)
  const [isEngagementFlipped, setIsEngagementFlipped] = useState(false)

  const toggleMomentum = useCallback(() => setIsMomentumFlipped(v => !v), [])
  const toggleAdherence = useCallback(() => setIsAdherenceFlipped(v => !v), [])
  const toggleEngagement = useCallback(() => setIsEngagementFlipped(v => !v), [])

  const data = MOCK_INSIGHTS

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Momentum Card */}
      <div className={`flip-card ${isMomentumFlipped ? 'flipped' : ''}`}>
        <Card
          className="relative overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-lg"
          onClick={toggleMomentum}
        >
          <div className="flip-card-inner">
            {/* Front */}
            <div className="flip-card-front">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Fitness Momentum</span>
                  </div>
                  <Badge className={trendBadgeClass(data.momentum.trend)}>
                    <TrendIcon trend={data.momentum.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {data.momentum.average > 0 ? '+' : ''}{data.momentum.average.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Volume Change</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Top Performers</span>
                    <span className="font-medium text-green-600">{data.momentum.topPerformers.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Needs Support</span>
                    <span className="font-medium text-red-600">{data.momentum.bottomPerformers.length}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">Click to see details</div>
              </CardContent>
            </div>
            {/* Back */}
            <div className="flip-card-back">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Fitness Momentum</span>
                  </div>
                  <Badge className={trendBadgeClass(data.momentum.trend)}>
                    <TrendIcon trend={data.momentum.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Top Performers
                    </h4>
                    <div className="space-y-2">
                      {data.momentum.topPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-green-600">+{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Needs Support
                    </h4>
                    <div className="space-y-2">
                      {data.momentum.bottomPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-red-600">{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>

      {/* Adherence Card */}
      <div className={`flip-card ${isAdherenceFlipped ? 'flipped' : ''}`}>
        <Card
          className="relative overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-lg"
          onClick={toggleAdherence}
        >
          <div className="flip-card-inner">
            {/* Front */}
            <div className="flip-card-front">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Workout Adherence</span>
                  </div>
                  <Badge className={trendBadgeClass(data.adherence.trend)}>
                    <TrendIcon trend={data.adherence.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {data.adherence.average.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">14-Day Completion Rate</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(data.adherence.average, 100)}%` }}
                  ></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">High Performers</span>
                    <span className="font-medium text-green-600">{data.adherence.topPerformers.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">At Risk</span>
                    <span className="font-medium text-red-600">{data.adherence.bottomPerformers.length}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">Click to see details</div>
              </CardContent>
            </div>
            {/* Back */}
            <div className="flip-card-back">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Workout Adherence</span>
                  </div>
                  <Badge className={trendBadgeClass(data.adherence.trend)}>
                    <TrendIcon trend={data.adherence.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      High Performers
                    </h4>
                    <div className="space-y-2">
                      {data.adherence.topPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-green-600">{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      At Risk
                    </h4>
                    <div className="space-y-2">
                      {data.adherence.bottomPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-red-600">{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>

      {/* Engagement Card */}
      <div className={`flip-card ${isEngagementFlipped ? 'flipped' : ''}`}>
        <Card
          className="relative overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-lg"
          onClick={toggleEngagement}
        >
          <div className="flip-card-inner">
            {/* Front */}
            <div className="flip-card-front">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Client Engagement</span>
                  </div>
                  <Badge className={trendBadgeClass(data.engagement.trend)}>
                    <TrendIcon trend={data.engagement.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {data.engagement.average.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Engagement Score</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(data.engagement.average, 100)}%` }}
                  ></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Highly Engaged</span>
                    <span className="font-medium text-green-600">{data.engagement.topPerformers.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Low Engagement</span>
                    <span className="font-medium text-red-600">{data.engagement.bottomPerformers.length}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">Click to see details</div>
              </CardContent>
            </div>
            {/* Back */}
            <div className="flip-card-back">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Client Engagement</span>
                  </div>
                  <Badge className={trendBadgeClass(data.engagement.trend)}>
                    <TrendIcon trend={data.engagement.trend} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Highly Engaged
                    </h4>
                    <div className="space-y-2">
                      {data.engagement.topPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-green-600">{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Low Engagement
                    </h4>
                    <div className="space-y-2">
                      {data.engagement.bottomPerformers.map(client => (
                        <div key={client.client_id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{client.client_name}</span>
                          <Badge variant="outline" className="text-red-600">{client.value.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
