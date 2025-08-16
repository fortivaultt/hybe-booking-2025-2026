import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Twitter, Instagram, Heart, MessageCircle, Share, ExternalLink, RefreshCw } from "lucide-react";

// Mock data for demonstration - in real implementation, these would come from APIs
const mockTweets = [
  {
    id: 1,
    user: "BTS_official",
    username: "BTS_twt",
    content: "Thank you ARMY for all your love and support! 💜 Our new album concept photos are coming soon! #BTS #ARMY",
    timestamp: "2m ago",
    likes: 98234,
    retweets: 23456,
    replies: 5432,
    verified: true
  },
  {
    id: 2,
    user: "BLACKPINK",
    username: "BLACKPINK",
    content: "BLACKPINK IN YOUR AREA! 🖤💗 New music video dropping this Friday! Are you ready? #BLACKPINK #BLINK",
    timestamp: "15m ago",
    likes: 145678,
    retweets: 34567,
    replies: 8901,
    verified: true
  },
  {
    id: 3,
    user: "NewJeans_ADOR",
    username: "NewJeans_ADOR",
    content: "Bunnies! 🐰 Thank you for streaming our latest tracks! Your support means everything to us 💙 #NewJeans #Bunnies",
    timestamp: "1h ago",
    likes: 76543,
    retweets: 18765,
    replies: 4321,
    verified: true
  }
];

const mockInstagramPosts = [
  {
    id: 1,
    user: "le_sserafim",
    username: "LE SSERAFIM",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    caption: "Behind the scenes from our latest photoshoot! ✨ #LESSERAFIM #Fearless",
    timestamp: "3h ago",
    likes: 234567,
    comments: 12345,
    verified: true
  },
  {
    id: 2,
    user: "fromis_9",
    username: "fromis_9",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop",
    caption: "Practice makes perfect! Working hard for our upcoming performances 💪 #fromis_9 #StayTuned",
    timestamp: "5h ago",
    likes: 187654,
    comments: 9876,
    verified: true
  },
  {
    id: 3,
    user: "official_seventeen",
    username: "SEVENTEEN",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    caption: "CARATs! Thank you for the amazing energy at tonight's concert! 🎤 #SEVENTEEN #CARAT",
    timestamp: "8h ago",
    likes: 445678,
    comments: 23456,
    verified: true
  }
];

export default function SocialMediaFeeds() {
  const [tweets, setTweets] = useState(mockTweets);
  const [instagramPosts, setInstagramPosts] = useState(mockInstagramPosts);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFeeds();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshFeeds = async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // In real implementation, fetch new data from APIs
      // For demo, we'll just shuffle the existing data and update timestamps
      setTweets(prev => [...prev].sort(() => Math.random() - 0.5));
      setInstagramPosts(prev => [...prev].sort(() => Math.random() - 0.5));
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Live Social Media</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshFeeds}
            disabled={isRefreshing}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Twitter Feed */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Twitter className="h-5 w-5 text-blue-500" />
              Latest Tweets
              <Badge variant="secondary" className="ml-auto">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {tweets.map((tweet) => (
              <div key={tweet.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-hybe-purple to-hybe-pink rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {tweet.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{tweet.user}</span>
                      {tweet.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-gray-500 text-xs">@{tweet.username}</span>
                      <span className="text-gray-500 text-xs">·</span>
                      <span className="text-gray-500 text-xs">{tweet.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-800 mb-3 leading-relaxed">{tweet.content}</p>
                    <div className="flex items-center gap-4 text-gray-500">
                      <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{formatNumber(tweet.likes)}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">{formatNumber(tweet.replies)}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                        <Share className="h-4 w-4" />
                        <span className="text-xs">{formatNumber(tweet.retweets)}</span>
                      </button>
                      <button className="ml-auto hover:text-gray-700 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instagram Feed */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Instagram className="h-5 w-5 text-pink-500" />
              Latest Posts
              <Badge variant="secondary" className="ml-auto">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {instagramPosts.map((post) => (
              <div key={post.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-hybe-purple to-hybe-pink rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {post.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{post.username}</span>
                      {post.verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{post.timestamp}</span>
                  </div>
                  <button className="hover:text-gray-700 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex items-center gap-4 mb-2 text-gray-500">
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">{formatNumber(post.likes)}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{formatNumber(post.comments)}</span>
                  </button>
                  <button className="hover:text-gray-700 transition-colors">
                    <Share className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-800 leading-relaxed">
                  <span className="font-semibold">{post.username}</span> {post.caption}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
