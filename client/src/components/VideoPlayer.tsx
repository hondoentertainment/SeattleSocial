import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  imageUrl: string;
  title: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export default function VideoPlayer({ videoUrl, imageUrl, title }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPlaying(false);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPlaying(true);
  };

  if (playing) {
    return (
      <div className="relative w-full h-full bg-black">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Close video and return to image"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {isYouTube(videoUrl) ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1&rel=0&modestbranding=1`}
            title={`Video preview for ${title}`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            aria-label={`Video preview for ${title}`}
          >
            <track kind="captions" />
          </video>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      {/* Play overlay */}
      <button
        onClick={handlePlay}
        className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label={`Play video preview for ${title}`}
      >
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-gray-900 ml-1" aria-hidden="true" />
        </div>
      </button>
      {/* Preview badge on hover */}
      <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Preview
      </div>
    </div>
  );
}
