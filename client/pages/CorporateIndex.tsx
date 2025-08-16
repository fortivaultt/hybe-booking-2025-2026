import { useState, useEffect } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HybeHeader from "@/components/HybeHeader";
import HybeFooter from "@/components/HybeFooter";
import CookieConsent from "@/components/CookieConsent";

interface VideoSlide {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoCode: string;
}

const CorporateIndex = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<string | null>(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  // Sample video data based on the HTML structure
  const videoSlides: VideoSlide[] = [
    {
      id: "203",
      title: "GO!",
      thumbnailUrl: "https://hybecorp.com/archive/i6HF7tazrSnrouXxXzaHWyKJEdRyX66oOjqg6kPp6fbzeQoPiztPKrC53f8ZFTGM5NoHOT3lK9F5TeJmHJRRzEUSGV7nWgmrOjD4OGOvvHBNASsiwXQeRSBmWSUIESuq.png",
      videoUrl: "https://www.youtube.com/embed/WXS-o57VJ5w",
      videoCode: "WXS-o57VJ5w"
    },
    {
      id: "202",
      title: "Take My Half",
      thumbnailUrl: "https://hybecorp.com/archive/dTML2yRJHGT8zhCatp5rwXnA4Eag10ti4uPOVb1oUWUb3Ha9r8mrUTkzTXpYDbuj21azfYljXNKehucMwxVUJYL8bgkf7szm5rPsJUYnZ3327z9NYzSLEnQd8hFbj0p2.jpg",
      videoUrl: "https://www.youtube.com/embed/VNWX3qWBd-A",
      videoCode: "VNWX3qWBd-A"
    },
    {
      id: "201",
      title: "Dance With You",
      thumbnailUrl: "https://hybecorp.com/archive/DvtQvxvaEhEDzeAwGRKtPtAIyFnK4dLQNdzjhHeejofznzraFkp5HKQKDRS2E1TJHUtGZwo63pYcNZVUhz8P2C7Pfnal3d2fH78WpCZSMgTcy6QCahOFyx9Pg2FYDarW.jpg",
      videoUrl: "https://www.youtube.com/embed/zOaZ_MoV18U",
      videoCode: "zOaZ_MoV18U"
    },
    {
      id: "200",
      title: "Bird of Night",
      thumbnailUrl: "https://hybecorp.com/archive/JaHKra1Uez7evpYBvLOufORgZgnexR1v15Oomhwt2rVERWcuFTNeqTwHR2g0obO8UOTBXATBwDE1itsuJcIG2EZUDTCVE2CO7Gg0d0GdyYaGECO52qbs9hl517JZksMM.jpg",
      videoUrl: "https://www.youtube.com/embed/0NpyuuGqK9k",
      videoCode: "0NpyuuGqK9k"
    },
    {
      id: "199",
      title: "Sunday Driver",
      thumbnailUrl: "https://hybecorp.com/archive/EPZeFcDONiOZ159xpyPfq9HIIhWh8yACUj6YCq0sbTRq176AgrPXXBTIxOtR7Uf6cboEnKIz5rYC6Gv8ABiT8iLhP2SpGOvTMMJpL3hDtaAaQnIJDWfUGGq4tKzSsPGO.jpg",
      videoUrl: "https://www.youtube.com/embed/o9thOizwRW4",
      videoCode: "o9thOizwRW4"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    if (!autoplayEnabled || isVideoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % videoSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [videoSlides.length, autoplayEnabled, isVideoPlaying]);

  const handlePlayVideo = (videoId: string) => {
    setIsVideoPlaying(videoId);
    setAutoplayEnabled(false);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videoSlides.length) % videoSlides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videoSlides.length);
  };

  const currentVideo = videoSlides[currentSlide];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HybeHeader />

      {/* Main Video Slider Section */}
      <div className="swiper-container hybe_main relative h-screen overflow-hidden">
        <div className="swiper-wrapper relative h-full">
          {/* Current Slide */}
          <div className="swiper-slide h-full relative flex items-center justify-center bg-black">
            {isVideoPlaying === currentVideo.id ? (
              /* Video Player */
              <iframe
                id={currentVideo.id}
                className="pc_video w-full h-full"
                src={`${currentVideo.videoUrl}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* Video Thumbnail */
              <div 
                className="video_img w-full h-full bg-cover bg-center relative cursor-pointer"
                style={{ backgroundImage: `url(${currentVideo.thumbnailUrl})` }}
                onClick={() => handlePlayVideo(currentVideo.id)}
              >
                <div className="absolute inset-0 bg-black bg-opacity-30" />
                <button className="play_btn absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 hover:scale-110">
                  <Play className="h-8 w-8 text-gray-900 ml-1" />
                </button>
                
                {/* Video Title Overlay */}
                <div className="absolute bottom-8 left-8 text-white">
                  <h2 className="text-4xl font-bold mb-2">{currentVideo.title}</h2>
                  <div className="w-16 h-1 bg-white"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-8 right-8 flex items-center space-x-4 z-10">
          {/* Slide Counter */}
          <div className="sp_num_ck text-white text-lg font-medium">
            <em>{String(currentSlide + 1).padStart(2, '0')}</em> / <span>{String(videoSlides.length).padStart(2, '0')}</span>
          </div>

          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            className="swiper-button-prev text-white hover:bg-white hover:bg-opacity-20 border border-white border-opacity-30"
            onClick={handlePrevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            className="swiper-button-next text-white hover:bg-white hover:bg-opacity-20 border border-white border-opacity-30"
            onClick={handleNextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="swiper-pagination absolute bottom-8 left-8 flex space-x-2 z-10">
          {videoSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Slide Thumbnails Preview */}
        <div className="absolute top-8 right-8 hidden lg:flex flex-col space-y-2 z-10 max-w-xs">
          {videoSlides.map((slide, index) => (
            <button
              key={slide.id}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white bg-opacity-90 text-black' 
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <img
                src={slide.thumbnailUrl}
                alt={slide.title}
                className="w-12 h-8 object-cover rounded"
              />
              <span className="text-sm font-medium truncate">{slide.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <HybeFooter />

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
};

export default CorporateIndex;
