import { Play } from "lucide-react"

interface VideoThumbnailProps {
  videoUrl: string
  exerciseName: string
  onClick: () => void
}

export default function VideoThumbnail({ videoUrl, exerciseName, onClick }: VideoThumbnailProps) {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Extract video ID from Vimeo URL
  const getVimeoVideoId = (url: string): string | null => {
    const regExp = /vimeo\.com\/(\d+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  const youtubeId = getYouTubeVideoId(videoUrl)
  const vimeoId = getVimeoVideoId(videoUrl)

  // Get thumbnail URL
  const getThumbnailUrl = (): string => {
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
    }
    if (vimeoId) {
      // Vimeo requires API call for thumbnails, so we'll use a placeholder
      return `https://vumbnail.com/${vimeoId}.jpg`
    }
    // For other video URLs, return a placeholder
    return '/placeholder-video.jpg'
  }

  const thumbnailUrl = getThumbnailUrl()

  return (
    <div 
      className="relative group cursor-pointer rounded-lg overflow-hidden w-20 h-12 bg-slate-200 dark:bg-slate-700 hover:scale-105 transition-transform duration-200"
      onClick={onClick}
      title={`Watch ${exerciseName} video`}
    >
      {/* Thumbnail Image */}
      <img
        src={thumbnailUrl}
        alt={`${exerciseName} video thumbnail`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          const target = e.target as HTMLImageElement
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA4MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAxNkw0OCAzMkwzMiAzMlYxNloiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+'
        }}
      />
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
        <div className="w-6 h-6 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center transition-colors duration-200">
          <Play className="w-3 h-3 text-slate-800 ml-0.5" fill="currentColor" />
        </div>
      </div>
      
      {/* Video Platform Badge */}
      <div className="absolute top-1 right-1">
        {youtubeId && (
          <div className="bg-red-600 text-white text-xs px-1 py-0.5 rounded font-medium">
            YT
          </div>
        )}
        {vimeoId && (
          <div className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded font-medium">
            VM
          </div>
        )}
        {!youtubeId && !vimeoId && (
          <div className="bg-slate-600 text-white text-xs px-1 py-0.5 rounded font-medium">
            VID
          </div>
        )}
      </div>
    </div>
  )
}
