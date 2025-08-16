import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";

const hybeVideos = [
  {
    id: 1,
    group: "BTS",
    title: "Dynamite (Official MV)",
    thumbnail: "https://img.youtube.com/vi/gdZLi9oWNZg/maxresdefault.jpg",
    videoId: "gdZLi9oWNZg",
    duration: "3:19",
  },
  {
    id: 2,
    group: "BLACKPINK",
    title: "How You Like That (Official MV)",
    thumbnail: "https://img.youtube.com/vi/ioNng23DkIM/maxresdefault.jpg",
    videoId: "ioNng23DkIM",
    duration: "3:01",
  },
  {
    id: 3,
    group: "NewJeans",
    title: "Get Up (Official MV)",
    thumbnail: "https://img.youtube.com/vi/ArmDp-zijuc/maxresdefault.jpg",
    videoId: "ArmDp-zijuc",
    duration: "2:59",
  },
  {
    id: 4,
    group: "LE SSERAFIM",
    title: "UNFORGIVEN (Official MV)",
    thumbnail: "https://img.youtube.com/vi/UBURTj20HXI/maxresdefault.jpg",
    videoId: "UBURTj20HXI",
    duration: "3:05",
  },
  {
    id: 5,
    group: "SEVENTEEN",
    title: "God of Music (Official MV)",
    thumbnail: "https://img.youtube.com/vi/XfJGSMj6mMw/maxresdefault.jpg",
    videoId: "XfJGSMj6mMw",
    duration: "3:27",
  },
  {
    id: 6,
    group: "TWICE",
    title: "SET ME FREE (Official MV)",
    thumbnail: "https://img.youtube.com/vi/s5SX-DyNEqA/maxresdefault.jpg",
    videoId: "s5SX-DyNEqA",
    duration: "3:18",
  },
  {
    id: 7,
    group: "Stray Kids",
    title: "S-Class (Official MV)",
    thumbnail: "https://img.youtube.com/vi/pCZj96n-6-Q/maxresdefault.jpg",
    videoId: "pCZj96n-6-Q",
    duration: "3:01",
  },
  {
    id: 8,
    group: "IVE",
    title: "I AM (Official MV)",
    thumbnail: "https://img.youtube.com/vi/6ZUIwj3FgUY/maxresdefault.jpg",
    videoId: "6ZUIwj3FgUY",
    duration: "3:35",
  },
];

export default function HybeVideoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = hybeVideos[currentIndex];

  useEffect(() => {
    if (isAutoPlay && !isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % hybeVideos.length);
      }, 5000); // Change video every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlay, isPlaying]);

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % hybeVideos.length);
  };

  const prevVideo = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + hybeVideos.length) % hybeVideos.length,
    );
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, you would control the YouTube iframe player
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would control the YouTube iframe player
  };

  const selectVideo = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Play className="h-6 w-6 text-hybe-purple" />
          HYBE Artists Showcase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Video Player */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            ref={videoRef}
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=${isAutoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`}
            title={currentVideo.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentVideo.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentVideo.group}
                  </Badge>
                  <span className="text-xs text-gray-300">
                    {currentVideo.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={prevVideo}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={nextVideo}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Thumbnails Carousel */}
        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
          {hybeVideos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => selectVideo(index)}
              className={`relative aspect-video rounded-md overflow-hidden transition-all duration-200 ${
                index === currentIndex
                  ? "ring-2 ring-hybe-purple shadow-lg scale-105"
                  : "hover:ring-2 hover:ring-hybe-pink hover:scale-102"
              }`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-1 right-1">
                <div className="text-white text-xs font-medium truncate">
                  {video.group}
                </div>
                <div className="text-white/80 text-xs truncate">
                  {video.duration}
                </div>
              </div>
              {index === currentIndex && (
                <div className="absolute inset-0 border-2 border-hybe-purple rounded-md" />
              )}
            </button>
          ))}
        </div>

        {/* Auto-play Toggle */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoPlay}
              onChange={(e) => setIsAutoPlay(e.target.checked)}
              className="w-4 h-4 text-hybe-purple bg-gray-100 border-gray-300 rounded focus:ring-hybe-purple focus:ring-2"
            />
            <span className="text-sm text-gray-600">Auto-play slideshow</span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
