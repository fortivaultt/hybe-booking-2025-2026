import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Mail, Phone, Calendar } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 30 seconds if user doesn't interact
    const timer = setTimeout(() => {
  window.location.href = "https://hybecorp.com"; // same tab
}, 30000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hybe-purple via-purple-600 to-hybe-pink flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Booking Request Submitted Successfully!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Thank You for Your Request!
            </h3>
            <p className="text-green-700 text-sm leading-relaxed">
              Your HYBE celebrity booking request has been successfully sent to
              our management team. We have received all your details and will
              begin processing your request immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Next Steps</h4>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Review & verification (24-48 hours)</li>
                <li>• Artist availability check</li>
                <li>• Custom quote preparation</li>
                <li>• Payment process setup</li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-purple-800">
                  What to Expect
                </h4>
              </div>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Email confirmation within 24 hours</li>
                <li>• Dedicated booking specialist assigned</li>
                <li>• Detailed proposal with timeline</li>
                <li>• Secure payment options provided</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">
                Need Immediate Assistance?
              </h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Our VIP booking specialists are available 24/7 for urgent requests
              or questions.
            </p>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>
                <strong>Email:</strong> <a href="mailto:hybe.corp@zohomail.com">support@hybecorp</a>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              We appreciate your trust in HYBE Corporation. Your dream
              experience with your favorite K-pop artists is our priority.
            </p>

            <Button
              onClick={() => (window.location.href = "https://hybecorp.com")}
              className="bg-gradient-to-r from-hybe-purple to-hybe-pink hover:from-purple-700 hover:to-pink-600 text-white px-8 py-2"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
