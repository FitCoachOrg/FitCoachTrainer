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

export interface InsightsData {
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

interface ClientInsightsCardsProps {
  data?: InsightsData | null
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

export function ClientInsightsCards({ data }: ClientInsightsCardsProps) {
  console.log('[ClientInsightsCards] mounted/render')
  // Local UI-only state for flips (no effects, no re-fetch)
  const [isMomentumFlipped, setIsMomentumFlipped] = useState(false)
  const [isAdherenceFlipped, setIsAdherenceFlipped] = useState(false)
  const [isEngagementFlipped, setIsEngagementFlipped] = useState(false)

  const toggleMomentum = useCallback(() => setIsMomentumFlipped(v => !v), [])
  const toggleAdherence = useCallback(() => setIsAdherenceFlipped(v => !v), [])
  const toggleEngagement = useCallback(() => setIsEngagementFlipped(v => !v), [])

  const insights = data || null

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
                  <Badge className={trendBadgeClass(insights?.momentum.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.momentum.trend ?? 'stable'} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {insights ? `${insights.momentum.average > 0 ? '+' : ''}${insights.momentum.average.toFixed(1)}%` : '—'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Volume Change</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Top Performers</span>
                    <span className="font-medium text-green-600">{insights?.momentum.topPerformers.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Needs Support</span>
                    <span className="font-medium text-red-600">{insights?.momentum.bottomPerformers.length ?? 0}</span>
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
                  <Badge className={trendBadgeClass(insights?.momentum.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.momentum.trend ?? 'stable'} />
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
                      {(insights?.momentum.topPerformers ?? []).map(client => (
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
                      {(insights?.momentum.bottomPerformers ?? []).map(client => (
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
                  <Badge className={trendBadgeClass(insights?.adherence.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.adherence.trend ?? 'stable'} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {insights ? `${insights.adherence.average.toFixed(1)}%` : '—'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">14-Day Completion Rate</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(insights?.adherence.average ?? 0, 100)}%` }}
                  ></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">High Performers</span>
                    <span className="font-medium text-green-600">{insights?.adherence.topPerformers.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">At Risk</span>
                    <span className="font-medium text-red-600">{insights?.adherence.bottomPerformers.length ?? 0}</span>
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
                  <Badge className={trendBadgeClass(insights?.adherence.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.adherence.trend ?? 'stable'} />
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
                      {(insights?.adherence.topPerformers ?? []).map(client => (
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
                      {(insights?.adherence.bottomPerformers ?? []).map(client => (
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
                  <Badge className={trendBadgeClass(insights?.engagement.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.engagement.trend ?? 'stable'} />
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {insights ? `${insights.engagement.average.toFixed(1)}%` : '—'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Engagement Score</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(insights?.engagement.average ?? 0, 100)}%` }}
                  ></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Highly Engaged</span>
                    <span className="font-medium text-green-600">{insights?.engagement.topPerformers.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Low Engagement</span>
                    <span className="font-medium text-red-600">{insights?.engagement.bottomPerformers.length ?? 0}</span>
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
                  <Badge className={trendBadgeClass(insights?.engagement.trend ?? 'stable')}>
                    <TrendIcon trend={insights?.engagement.trend ?? 'stable'} />
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
                      {(insights?.engagement.topPerformers ?? []).map(client => (
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
                      {(insights?.engagement.bottomPerformers ?? []).map(client => (
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
