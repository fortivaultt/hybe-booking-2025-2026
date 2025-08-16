import HybeHeader from "@/components/HybeHeader";
import HybeFooter from "@/components/HybeFooter";
import CookieConsent from "@/components/CookieConsent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyInfo() {
  return (
    <div className="min-h-screen bg-white">
      <HybeHeader />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <CardHeader className="text-center mb-8">
            <CardTitle className="text-4xl font-bold text-gray-900">
              Company Information
            </CardTitle>
            <p className="text-lg text-gray-600 mt-4">
              Learn about HYBE Corporation's mission, vision, and values
            </p>
          </CardHeader>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">About HYBE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  HYBE Corporation is a South Korean multinational entertainment company 
                  established in 2005. Originally known as Big Hit Entertainment, the company 
                  was rebranded to HYBE in 2021 to reflect its expansion beyond music into 
                  various entertainment platforms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We are home to some of the world's biggest K-pop acts including BTS, 
                  BLACKPINK, NewJeans, LE SSERAFIM, SEVENTEEN, TWICE, Stray Kids, and IVE.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To connect music and people, and to bring positive influence to the world 
                  through our content and platform. We believe in the power of music to 
                  transcend boundaries and unite people across cultures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Company Values</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li>• <strong>Innovation:</strong> Pioneering new technologies and platforms in entertainment</li>
                  <li>• <strong>Excellence:</strong> Maintaining the highest standards in all our endeavors</li>
                  <li>• <strong>Diversity:</strong> Embracing different cultures and perspectives</li>
                  <li>• <strong>Authenticity:</strong> Staying true to our artists' unique voices and stories</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <HybeFooter />
      <CookieConsent />
    </div>
  );
}
