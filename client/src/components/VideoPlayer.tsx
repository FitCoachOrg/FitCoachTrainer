import React, { useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  channelTitle?: string;
  score?: number;
  reason?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  channelTitle,
  score,
  reason,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract video ID from various YouTube URL formats
  const getVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const videoId = getVideoId(videoUrl);
  
  if (!videoId) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1 text-blue-500 underline"
        >
          <ExternalLink className="h-4 w-4" />
          <span>View Video</span>
        </a>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <>
      {/* Video Preview Card */}
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
          {/* Thumbnail */}
          <div className="relative w-24 h-16 bg-gray-200 rounded overflow-hidden">
            <img 
              src={thumbnailUrl} 
              alt={title || 'Exercise video'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 bg-gray-300 items-center justify-center">
              <Play className="h-6 w-6 text-gray-600" />
            </div>
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-1 group-hover:scale-110 transition-transform duration-200">
                <Play className="h-4 w-4 text-black fill-current" />
              </div>
            </div>
          </div>
          
          {/* Video Info */}
          <div className="mt-1 text-xs text-gray-600 max-w-24">
            {title && (
              <div className="truncate font-medium" title={title}>
                {title}
              </div>
            )}
            {channelTitle && (
              <div className="truncate text-gray-500" title={channelTitle}>
                {channelTitle}
              </div>
            )}
            {score && (
              <div className="text-green-600 font-medium">
                Score: {score.toFixed(2)}
              </div>
            )}
          </div>
        </div>
        
        {/* External Link */}
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="text-blue-500 hover:text-blue-700 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Video Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex-1">
                {title && <div className="text-lg font-semibold">{title}</div>}
                {channelTitle && <div className="text-sm text-gray-600">{channelTitle}</div>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 relative">
            <iframe
              src={embedUrl}
              title={title || 'Exercise video'}
              className="w-full h-full rounded"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          {reason && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-700">Why this video was selected:</div>
              <div className="text-sm text-gray-600 mt-1">{reason}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoPlayer;
