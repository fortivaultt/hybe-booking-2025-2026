import { useParams } from "react-router-dom";
import HybeHeader from "@/components/HybeHeader";
import HybeFooter from "@/components/HybeFooter";
import CookieConsent from "@/components/CookieConsent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  const params = useParams();
  const pagePath = window.location.pathname;
  
  const getPageTitle = () => {
    if (title) return title;
    
    // Generate title from URL path
    const pathSegments = pagePath.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment
      ? lastSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Page';
  };

  const getPageDescription = () => {
    if (description) return description;
    
    const pathMap: Record<string, string> = {
      '/company/artist': 'Information about our talented artists and their achievements',
      '/company/business': 'Details about our business operations and strategies',
      '/company/ethical': 'Our commitment to ethical business practices and corporate responsibility',
      '/ir/esg': 'Environmental, Social, and Governance initiatives',
      '/ir/structure': 'Corporate governance structure and leadership',
      '/ir/announce': 'Latest announcements for investors',
      '/ir/official': 'Official public disclosure information',
      '/ir/finance': 'Financial reports and statements',
      '/ir/share': 'Stock information and shareholder resources',
      '/ir/event': 'Upcoming investor relations events',
      '/ir/archive': 'Historical investor relations data',
      '/news/announcements': 'Latest company announcements',
      '/news/news': 'Press releases and news coverage',
      '/news/notice': 'Important notices and updates',
      '/career/crew': 'Learn about HYBE DNA and our team culture',
    };
    
    return pathMap[pagePath] || 'This page is currently under development';
  };

  return (
    <div className="min-h-screen bg-white">
      <HybeHeader />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader className="pb-8">
              <div className="mx-auto w-16 h-16 bg-hybe-purple/10 rounded-full flex items-center justify-center mb-4">
                <Construction className="w-8 h-8 text-hybe-purple" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {getPageTitle()}
              </CardTitle>
              <p className="text-lg text-gray-600 mt-4">
                Coming Soon
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                {getPageDescription()}
              </p>
              
              <div className="p-4 bg-gradient-to-r from-hybe-purple/5 to-hybe-pink/5 rounded-lg">
                <p className="text-sm text-gray-600">
                  We're working hard to bring you this content. Please check back soon for updates.
                </p>
              </div>

              <Button 
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-hybe-purple to-hybe-pink hover:from-purple-700 hover:to-pink-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <HybeFooter />
      <CookieConsent />
    </div>
  );
}
