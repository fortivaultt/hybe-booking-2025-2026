import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  advertising: boolean;
}

const CookieConsent = () => {
  const [isFloatingCookieVisible, setIsFloatingCookieVisible] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    essential: true,
    analytics: false,
    functionality: false,
    advertising: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("hybe-cookie-consent");
    if (!cookieConsent) {
      setIsFloatingCookieVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allCookies = {
      essential: true,
      analytics: true,
      functionality: true,
      advertising: true,
    };
    setCookieSettings(allCookies);
    saveCookiePreferences(allCookies);
    setIsFloatingCookieVisible(false);
    setIsPopupVisible(false);
  };

  const handleRefuseAndContinue = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      functionality: false,
      advertising: false,
    };
    setCookieSettings(essentialOnly);
    saveCookiePreferences(essentialOnly);
    setIsFloatingCookieVisible(false);
    setIsPopupVisible(false);
  };

  const handleCustomize = () => {
    setIsPopupVisible(true);
  };

  const handleSaveCustom = () => {
    saveCookiePreferences(cookieSettings);
    setIsFloatingCookieVisible(false);
    setIsPopupVisible(false);
  };

  const saveCookiePreferences = (settings: CookieSettings) => {
    localStorage.setItem("hybe-cookie-consent", JSON.stringify(settings));
    localStorage.setItem("hybe-cookie-consent-date", new Date().toISOString());
  };

  const handleCookieToggle = (type: keyof CookieSettings, value: boolean) => {
    setCookieSettings(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!isFloatingCookieVisible) return null;

  return (
    <>
      {/* Floating Cookie Notification */}
      <div className="floating-cookie fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="floating-cookie-wrap p-4">
          <div className="floating-cookie-text text-sm text-gray-700 mb-4">
            Please allow service to collect cookies for a smooth experience with auto login.{" "}
            <strong>
              <a href="/eng/cookie" className="text-purple-600 hover:text-purple-800 underline">
                More
              </a>
            </strong>
          </div>

          <div className="floating-cookie-btn-group space-y-3">
            <button
              type="button"
              className="floating-cookie-btn-link w-full text-sm text-gray-600 hover:text-gray-800 underline"
              onClick={handleRefuseAndContinue}
            >
              Refuse and continue
            </button>

            <div className="floating-cookie-btn-box flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="floating-cookie-btn flex-1"
                onClick={handleCustomize}
              >
                Customize
              </Button>
              <Button
                type="button"
                className="floating-cookie-btn-primary flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleAcceptAll}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Popup */}
      {isPopupVisible && (
        <div className="pop-cookie fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="pop-wrap bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-hidden mx-4">
            <div className="pop-body">
              <div className="scroll-wrap p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="pop-title-1 text-xl font-bold text-gray-900">
                    Consent to Collection of Cookies
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPopupVisible(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Cookies are small text files placed on your device which we use to improve your experience on our website and to show you relevant advertising. Our partners and the cookies placed on your device are detailed below. You are also able to manage which cookies are set on your device below. You can change your preferences at any time by clicking on the "Cookie Preferences" icon at the bottom of our website. Your choice will be retained for 12 months. For more information, refer to our Cookie Policy.
                </p>

                <ul className="cookie-check-list space-y-4">
                  <li className="item border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="cookie-check-title font-semibold text-gray-900">
                        Essential Cookies
                      </div>
                      <label className="btn-switch">
                        <Checkbox checked={cookieSettings.essential} disabled />
                      </label>
                    </div>
                    <div className="cookie-check-text text-sm text-gray-600">
                      These cookies are strictly necessary for the provision of the service that you have expressly requested or have the sole purpose of enabling or facilitating communication by electronic means. For example, they allow us to remember the items you have placed in your shopping basket. These cookies are automatically activated and cannot be deactivated because they are essential to enable you to browse our site.
                      <a href="/eng/cookie" className="link text-purple-600 hover:text-purple-800 underline ml-2">
                        VIEW COOKIES
                      </a>
                    </div>
                  </li>

                  <li className="item border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="cookie-check-title font-semibold text-gray-900">
                        Analytical/Performance Cookies
                      </div>
                      <Checkbox
                        checked={cookieSettings.analytics}
                        onCheckedChange={(checked) => handleCookieToggle('analytics', checked as boolean)}
                      />
                    </div>
                    <div className="cookie-check-text text-sm text-gray-600">
                      These cookies allow us to understand how you access the site and your browsing habits (e.g. pages viewed, time spent on a page, content clicked). They allow us to analyze the performance and design of our site and to detect possible errors. Owing to these performance indicators, we are constantly improving our site and our products, content and offers.
                      <a href="/eng/cookie" className="link text-purple-600 hover:text-purple-800 underline ml-2">
                        VIEW COOKIES
                      </a>
                    </div>
                  </li>

                  <li className="item border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="cookie-check-title font-semibold text-gray-900">
                        Functionality and Profile Cookies
                      </div>
                      <Checkbox
                        checked={cookieSettings.functionality}
                        onCheckedChange={(checked) => handleCookieToggle('functionality', checked as boolean)}
                      />
                    </div>
                    <div className="cookie-check-text text-sm text-gray-600">
                      These cookies allow us to offer you customized content according to your profile, your interests and your usage. For example, AB test cookies allow us to test different versions of a page/service in order to statistically identify visitor preferences. By accepting these cookies, you help us to improve the layout and features of our site.
                      <a href="/eng/cookie" className="link text-purple-600 hover:text-purple-800 underline ml-2">
                        VIEW COOKIES
                      </a>
                    </div>
                  </li>

                  <li className="item border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="cookie-check-title font-semibold text-gray-900">
                        Advertising / Targeting Cookies
                      </div>
                      <Checkbox
                        checked={cookieSettings.advertising}
                        onCheckedChange={(checked) => handleCookieToggle('advertising', checked as boolean)}
                      />
                    </div>
                    <div className="cookie-check-text text-sm text-gray-600">
                      These cookies collect information about your browsing habits. They remember that you have visited our site and share this information with partners, such as advertisers, for the purpose of targeted advertising. The use of these cookies include displaying advertisements, impression capping, fraud prevention, billing, and measurement.
                      <a href="/eng/cookie" className="link text-purple-600 hover:text-purple-800 underline ml-2">
                        VIEW COOKIES
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pop-footer flex gap-3 p-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                className="btn-secondary flex-1"
                onClick={() => setIsPopupVisible(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="btn flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleSaveCustom}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
