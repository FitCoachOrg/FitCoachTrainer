import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface VideoModalProps {
  open: boolean
  onClose: () => void
  videoUrl: string
  exerciseName: string
}

export default function VideoModal({ open, onClose, videoUrl, exerciseName }: VideoModalProps) {
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

  // Get embedded video URL
  const getEmbedUrl = (url: string): string => {
    const youtubeId = getYouTubeVideoId(url)
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`
    }
    
    const vimeoId = getVimeoVideoId(url)
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
    }
    
    // For other video URLs, return as is
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)
  const isYouTube = getYouTubeVideoId(videoUrl) !== null
  const isVimeo = getVimeoVideoId(videoUrl) !== null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 bg-black">
        <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <DialogTitle className="text-white text-lg font-semibold bg-black/50 px-3 py-1 rounded">
            {exerciseName}
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        
        <div className="w-full h-full flex items-center justify-center">
          {isYouTube || isVimeo ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exerciseName}
            />
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
