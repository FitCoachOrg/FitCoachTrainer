/**
 * ProgressPicturesCard Component
 * 
 * This component displays a standalone progress pictures card with:
 * - Upload functionality for progress photos
 * - Progress timeline showing recent photos from Supabase
 * - Progress statistics
 * - Purple gradient styling with camera icon
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface ProgressPicture {
  name: string
  url: string
  created_at: string
  size: number
}

interface ProgressPicturesCardProps {
  clientId?: number
}

export const ProgressPicturesCard: React.FC<ProgressPicturesCardProps> = ({ clientId }) => {
  const [progressPictures, setProgressPictures] = useState<ProgressPicture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch progress pictures from Supabase
  const fetchProgressPictures = async () => {
    if (!clientId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.storage
        .from('client-images')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) {
        console.error('❌ Error fetching progress pictures:', error)
        setError('Failed to load progress pictures')
        return
      }
      
      // Filter for progress pictures for this client
      const clientProgressPictures = data
        .filter(file => {
          const fileName = file.name
          const clientPattern = new RegExp(`^${clientId}_progress_\\d{2}_\\d{2}_\\d{2}\\.jpg$`)
          return clientPattern.test(fileName)
        })
        .map(file => ({
          name: file.name,
          url: `${supabase.storage.from('client-images').getPublicUrl(file.name).data.publicUrl}`,
          created_at: file.created_at || new Date().toISOString(),
          size: file.metadata?.size || 0
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      console.log('📸 Progress pictures found:', clientProgressPictures.length)
      setProgressPictures(clientProgressPictures)
      
    } catch (err) {
      console.error('❌ Error in fetchProgressPictures:', err)
      setError('Failed to load progress pictures')
    } finally {
      setLoading(false)
    }
  }



  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Extract progress info from filename
  const getProgressInfo = (fileName: string) => {
    const match = fileName.match(/^(\d+)_progress_(\d{2})_(\d{2})_(\d{2})\.jpg$/)
    if (match) {
      const [, clientId, day, month, year] = match
      const date = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day))
      const weekNumber = Math.ceil(date.getDate() / 7)
      return {
        week: `Week ${weekNumber}`,
        date: date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
      }
    }
    return { week: 'Progress', date: 'Unknown' }
  }

  // Fetch pictures on component mount and when clientId changes
  useEffect(() => {
    fetchProgressPictures()
  }, [clientId])

  // Calculate progress stats
  const totalPhotos = progressPictures.length
  const lastUpload = progressPictures.length > 0 ? formatDate(progressPictures[0].created_at) : 'Never'
  const progressPeriod = progressPictures.length > 1 
    ? formatDate(progressPictures[progressPictures.length - 1].created_at)
    : 'N/A'
  const nextDue = totalPhotos > 0 ? '5 days' : 'Today'
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-900/90">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span className="text-gray-900 dark:text-white">Progress Pictures</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-1">
              Track your fitness journey with photos
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading progress pictures...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Pictures Gallery */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress Pictures</h4>
              {progressPictures.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No progress pictures yet</p>
                  <p className="text-sm text-gray-400">Progress pictures will appear here</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 gap-3">
                    {progressPictures.map((picture, index) => (
                      <a
                        key={index}
                        href={picture.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        title={new Date(picture.created_at).toLocaleString()}
                      >
                        <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={picture.url}
                            alt="Progress"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-gray-500 dark:text-gray-400">📸</span></div>'
                            }}
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Progress Stats</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Photos:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{totalPhotos}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Last Upload:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{lastUpload}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress Period:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{progressPeriod}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                  <span className="text-gray-600 dark:text-gray-400">Next Due:</span>
                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{nextDue}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 