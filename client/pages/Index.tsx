import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookingRequest, BookingResponse } from "@shared/booking";
import {
  SubscriptionValidationRequest,
  SubscriptionValidationResponse,
} from "@shared/subscription";
import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@shared/api";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import CookieConsent from "@/components/CookieConsent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CalendarDays,
  Star,
  Users,
  MapPin,
  Heart,
  Crown,
  Sparkles,
  Music,
  Loader2,
} from "lucide-react";
import HybeVideoSlider from "@/components/HybeVideoSlider";
import SocialMediaFeeds from "@/components/SocialMediaFeeds";

const fanPreferences = [
  "New to K-pop",
  "Casual Fan",
  "Dedicated Fan",
  "Super Fan",
  "Ultimate Stan",
];

const kpopGroups = [
  {
    name: "BTS",
    members: ["RM", "Jin", "Suga", "J-Hope", "Jimin", "V", "Jungkook"],
    tier: "Standard",
    basePrice: "22,500",
  },
  {
    name: "BLACKPINK",
    members: ["Jisoo", "Jennie", "Rosé", "Lisa"],
    tier: "Premium",
    basePrice: "800,000",
  },
  {
    name: "NewJeans",
    members: ["Minji", "Hanni", "Danielle", "Haerin", "Hyein"],
    tier: "Elite",
    basePrice: "600,000",
  },
  {
    name: "LE SSERAFIM",
    members: ["Sakura", "Chaewon", "Yunjin", "Kazuha", "Eunchae"],
    tier: "Elite",
    basePrice: "550,000",
  },
  {
    name: "SEVENTEEN",
    members: [
      "S.Coups",
      "Jeonghan",
      "Joshua",
      "Jun",
      "Hoshi",
      "Wonwoo",
      "Woozi",
      "DK",
      "Mingyu",
      "The8",
      "Seungkwan",
      "Vernon",
      "Dino",
    ],
    tier: "Premium",
    basePrice: "750,000",
  },
  {
    name: "TWICE",
    members: [
      "Nayeon",
      "Jeongyeon",
      "Momo",
      "Sana",
      "Jihyo",
      "Mina",
      "Dahyun",
      "Chaeyoung",
      "Tzuyu",
    ],
    tier: "Elite",
    basePrice: "650,000",
  },
  {
    name: "Stray Kids",
    members: [
      "Bang Chan",
      "Lee Know",
      "Changbin",
      "Hyunjin",
      "Han",
      "Felix",
      "Seungmin",
      "I.N",
    ],
    tier: "Elite",
    basePrice: "500,000",
  },
  {
    name: "IVE",
    members: ["Yujin", "Gaeul", "Rei", "Wonyoung", "Liz", "Leeseo"],
    tier: "Standard",
    basePrice: "400,000",
  },
];

const eventTypes = [
  {
    name: "Meet & Greet",
    description: "Personal interaction with your favorite artist",
    icon: Heart,
    duration: "30-60 min",
  },
  {
    name: "Private Event",
    description: "Exclusive performance for your special occasion",
    icon: Crown,
    duration: "2-4 hours",
  },
  {
    name: "Vacation Package",
    description: "Travel experience with celebrity appearances",
    icon: MapPin,
    duration: "3-7 days",
  },
  {
    name: "Studio Session",
    description: "Behind-the-scenes studio experience",
    icon: Music,
    duration: "4-8 hours",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const [fanPreference, setFanPreference] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [budget, setBudget] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [attendees, setAttendees] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [location, setLocation] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [subscriptionValidation, setSubscriptionValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
    subscriptionType?: string;
    userName?: string;
  }>({
    isValidating: false,
    isValid: null,
    message: "",
  });

  // Frontend cache for subscription validation results
  const [validationCache, setValidationCache] = useState<Record<string, any>>(
    {},
  );
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [otpState, setOtpState] = useState<{
    otpSent: boolean;
    isSending: boolean;
    isVerifying: boolean;
    isVerified: boolean;
    otp: string;
    message: string;
  }>({
    otpSent: false,
    isSending: false,
    isVerifying: false,
    isVerified: false,
    otp: "",
    message: "",
  });

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirectClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    if (!href) return;

    // Start loading animation
    setIsRedirecting(true);

    // Add a brief delay for better UX (loading animation)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Open in new tab to avoid losing form data
    window.open(href, "_blank");

    // Reset loading state
    setIsRedirecting(false);
  };

  // Get selected group data
  const selectedGroupData = kpopGroups.find(
    (group) => group.name === selectedGroup,
  );

  // Validate subscription ID format (HYB + 10 alphanumeric)
  const isValidSubscriptionId = (id: string) => {
    // Basic format validation - detailed validation happens server-side
    const regex = /^[A-Z0-9]{10,13}$/i;
    return regex.test(id) && id.length >= 10;
  };

  // Validate subscription ID against database
  const validateSubscriptionIdInDatabase = async (id: string) => {
    if (!isValidSubscriptionId(id)) {
      const errorResult = {
        isValidating: false,
        isValid: false,
        message: "Invalid format. Please enter a valid subscription ID.",
      };
      setSubscriptionValidation(errorResult);
      return;
    }

    // Check frontend cache first
    const cacheKey = id.toUpperCase();
    if (validationCache[cacheKey]) {
      const cachedResult = validationCache[cacheKey];
      // Only use cache if it's less than 5 minutes old
      if (Date.now() - cachedResult.timestamp < 300000) {
        setSubscriptionValidation({
          isValidating: false,
          isValid: cachedResult.isValid,
          message: cachedResult.message,
          subscriptionType: cachedResult.subscriptionType,
          userName: cachedResult.userName,
        });
        return;
      } else {
        // Remove expired cache entry
        setValidationCache((prev) => {
          const updated = { ...prev };
          delete updated[cacheKey];
          return updated;
        });
      }
    }

    setSubscriptionValidation((prev) => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch("/api/subscription/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: id,
        } as SubscriptionValidationRequest),
      });

      const result: SubscriptionValidationResponse = await response.json();

      const validationResult = {
        isValidating: false,
        isValid: result.isValid,
        message: result.message,
        subscriptionType: result.subscriptionType,
        userName: result.userName,
      };

      setSubscriptionValidation(validationResult);

      // Cache the result with timestamp
      setValidationCache((prev) => ({
        ...prev,
        [cacheKey]: {
          ...validationResult,
          timestamp: Date.now(),
        },
      }));
    } catch (error) {
      const errorResult = {
        isValidating: false,
        isValid: false,
        message: "Error validating subscription ID. Please try again.",
      };
      setSubscriptionValidation(errorResult);
    }
  };

  // Auto-populate contact name when subscription is validated
  useEffect(() => {
    if (
      subscriptionValidation.isValid &&
      subscriptionValidation.userName &&
      !contactInfo.name
    ) {
      setContactInfo((prev) => ({
        ...prev,
        name: subscriptionValidation.userName || "",
      }));
    }
  }, [
    subscriptionValidation.userName,
    subscriptionValidation.isValid,
    contactInfo.name,
  ]);

  // Debounced validation effect
  useEffect(() => {
    if (!subscriptionId) {
      setSubscriptionValidation({
        isValidating: false,
        isValid: null,
        message: "",
      });
      return;
    }

    // Don't validate if the input is too short or obviously invalid
    if (subscriptionId.length < 3) {
      setSubscriptionValidation({
        isValidating: false,
        isValid: null,
        message: "",
      });
      return;
    }

    // Increase debounce delay to reduce API calls while typing
    const timeoutId = setTimeout(() => {
      // Only validate if the subscription ID hasn't changed recently
      validateSubscriptionIdInDatabase(subscriptionId);
    }, 800); // Increased from 500ms to 800ms

    return () => clearTimeout(timeoutId);
  }, [subscriptionId]);

  const handleSendOtp = async () => {
    setOtpState((prev) => ({ ...prev, isSending: true, message: "" }));
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactInfo.email } as SendOtpRequest),
      });
      const result: SendOtpResponse = await response.json();
      if (result.success) {
        setOtpState((prev) => ({
          ...prev,
          otpSent: true,
          message: result.message,
        }));
      } else {
        setOtpState((prev) => ({
          ...prev,
          message: result.message || "Failed to send OTP.",
        }));
      }
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        message: "An unknown error occurred.",
      }));
    } finally {
      setOtpState((prev) => ({ ...prev, isSending: false }));
    }
  };

  const handleVerifyOtp = async () => {
    setOtpState((prev) => ({ ...prev, isVerifying: true, message: "" }));
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactInfo.email,
          otp: otpState.otp,
        } as VerifyOtpRequest),
      });
      const result: VerifyOtpResponse = await response.json();
      if (result.success) {
        setOtpState((prev) => ({
          ...prev,
          isVerified: true,
          message: result.message,
        }));
      } else {
        setOtpState((prev) => ({
          ...prev,
          isVerified: false,
          message: result.message || "Failed to verify OTP.",
        }));
      }
    } catch (error) {
      setOtpState((prev) => ({
        ...prev,
        isVerified: false,
        message: "An unknown error occurred.",
      }));
    } finally {
      setOtpState((prev) => ({ ...prev, isVerifying: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpState.isVerified) {
      setSubmitMessage(
        "Please verify your email with an OTP before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    // Loading simulation with steps
    const loadingSteps = [
      "Verifying subscription ID...",
      "Checking form fields...",
      "Submitting form...",
      "Form submitted successfully!",
    ];

    for (let i = 0; i < loadingSteps.length; i++) {
      setLoadingStep(loadingSteps[i]);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay per step
    }

    const finalBudget = budget === "custom" ? customAmount : budget;

    const bookingData: BookingRequest = {
      fanPreference,
      selectedCelebrity: `${selectedGroup} - ${selectedArtist}`,
      selectedEventType,
      budget: finalBudget,
      attendees,
      preferredDate,
      location,
      specialRequests,
      subscriptionId: subscriptionId || undefined,
      contactInfo,
      privacyConsent,
    };

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result: BookingResponse = await response.json();

      if (result.success) {
        // Redirect to success page
        navigate("/success");
      } else {
        setSubmitSuccess(false);
        setSubmitMessage(result.message);
        setIsSubmitting(false);
        setLoadingStep("");
      }
    } catch (error) {
      setSubmitSuccess(false);
      setSubmitMessage(
        "Network error. Please check your connection and try again.",
      );
      setIsSubmitting(false);
      setLoadingStep("");
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 text-center leading-tight">
                CELEBRITY BOOKING PLATFORM
              </h1>
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto mb-6 px-2">
            Official HYBE celebrity booking platform. Book exclusive experiences
            with the world's biggest K-pop stars. From intimate meet & greets to
            luxury vacation packages.
          </p>
          <div className="inline-flex items-center px-4 sm:px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg mx-2">
            <p className="text-xs sm:text-sm text-gray-700 text-center">
              🎯 Powered by{" "}
              <strong className="text-purple-600">HYBE Corporation</strong> -
              Home to BTS, BLACKPINK, NewJeans & More
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-600" />
              <span>Premium Artists</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>Exclusive Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <span>VIP Treatment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* HYBE Video Slider */}
          <div className="mb-8">
            <HybeVideoSlider />
          </div>

          {/* Social Media Feeds */}
          <div className="mb-8">
            <SocialMediaFeeds />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 relative z-10">
            {/* Booking Form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Card className="border-0 shadow-none">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Book Your Experience
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base lg:text-lg">
                    Fill out the form below to request a custom booking with
                    your chosen artist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Fan to Artist Preference */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="fanPreference"
                        className="text-base font-semibold"
                      >
                        Select Fan to Artist Preference
                      </Label>
                      <Select
                        value={fanPreference}
                        onValueChange={setFanPreference}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="How would you describe your K-pop fandom?" />
                        </SelectTrigger>
                        <SelectContent>
                          {fanPreferences.map((preference) => (
                            <SelectItem key={preference} value={preference}>
                              {preference}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Group Selection */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="group"
                        className="text-base font-semibold"
                      >
                        Select Your Favorite Group
                      </Label>
                      <Select
                        value={selectedGroup}
                        onValueChange={(value) => {
                          setSelectedGroup(value);
                          setSelectedArtist(""); // Reset artist selection when group changes
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose your favorite K-pop group" />
                        </SelectTrigger>
                        <SelectContent>
                          {kpopGroups.map((group) => (
                            <SelectItem key={group.name} value={group.name}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                  {group.name}
                                </span>
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge
                                    variant={
                                      group.tier === "Premium"
                                        ? "default"
                                        : group.tier === "Elite"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {group.tier}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    from ${group.basePrice}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Artist Selection */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="artist"
                        className="text-base font-semibold"
                      >
                        Select Favorite Artist
                      </Label>
                      <Select
                        value={selectedArtist}
                        onValueChange={setSelectedArtist}
                        disabled={!selectedGroup}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue
                            placeholder={
                              selectedGroup
                                ? "Choose your favorite member"
                                : "Select a group first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedGroupData?.members.map((member) => (
                            <SelectItem key={member} value={member}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({selectedGroup})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Event Type */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="eventType"
                        className="text-base font-semibold"
                      >
                        Event Type
                      </Label>
                      <Select
                        value={selectedEventType}
                        onValueChange={setSelectedEventType}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((event) => (
                            <SelectItem key={event.name} value={event.name}>
                              <div className="flex items-center gap-3">
                                <event.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">
                                    {event.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {event.duration}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="budget"
                        className="text-base font-semibold"
                      >
                        Total Budget (USD)
                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                          Covers accommodation, HYBE fees, artist fees, travel,
                          and all associated costs
                        </span>
                      </Label>
                      <Select
                        value={budget}
                        onValueChange={(value) => {
                          setBudget(value);
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your complete budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="22500-50000">
                            $22,500 - $50,000
                          </SelectItem>
                          <SelectItem value="50000-100000">
                            $50,000 - $100,000
                          </SelectItem>
                          <SelectItem value="100000-250000">
                            $100,000 - $250,000
                          </SelectItem>
                          <SelectItem value="250000-500000">
                            $250,000 - $500,000
                          </SelectItem>
                          <SelectItem value="500000-750000">
                            $500,000 - $750,000
                          </SelectItem>
                          <SelectItem value="750000-1000000">
                            $750,000 - $1,000,000
                          </SelectItem>
                          <SelectItem value="1000000+">$1,000,000+</SelectItem>
                          <SelectItem value="custom">Custom Amount</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Custom Amount Input */}
                      {budget && (
                        <div className="mt-3">
                          <Label
                            htmlFor="customAmount"
                            className="text-sm font-medium"
                          >
                            Enter Your Custom Amount (USD) *
                          </Label>
                          <Input
                            id="customAmount"
                            type="number"
                            placeholder="e.g., 750000"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="h-12 mt-1 mobile-input text-base"
                            min="22500"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum amount: $22,500
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="attendees"
                          className="text-base font-semibold"
                        >
                          Number of Attendees
                        </Label>
                        <Input
                          id="attendees"
                          type="number"
                          placeholder="e.g., 50"
                          value={attendees}
                          onChange={(e) => setAttendees(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="date"
                          className="text-base font-semibold"
                        >
                          Preferred Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="location"
                        className="text-base font-semibold"
                      >
                        Location/Venue
                      </Label>
                      <Input
                        id="location"
                        placeholder="City, Country or specific venue"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Subscription ID */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="subscriptionId"
                        className="text-base font-semibold"
                      >
                        HYBE Subscription ID (Recommended)
                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                          Valid subscription provides priority booking and
                          discounts
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="subscriptionId"
                          placeholder="Enter your subscription ID"
                          value={subscriptionId}
                          onChange={(e) =>
                            setSubscriptionId(e.target.value.toUpperCase())
                          }
                          className={`h-12 pr-10 ${
                            subscriptionValidation.isValid === false
                              ? "border-red-300 focus:border-red-500"
                              : subscriptionValidation.isValid === true
                                ? "border-green-300 focus:border-green-500"
                                : ""
                          }`}
                          maxLength={15}
                        />
                        {subscriptionValidation.isValidating && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                          </div>
                        )}
                        {subscriptionValidation.isValid === true && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="h-4 w-4 text-green-600">✓</div>
                          </div>
                        )}
                        {subscriptionValidation.isValid === false && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="h-4 w-4 text-red-600">✗</div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-right mt-1">
                        <a
                          href="https://official-hybefanpermit.netlify.app/"
                          onClick={handleRedirectClick}
                          className={`group relative inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-all duration-300 ${
                            isRedirecting
                              ? "cursor-wait pointer-events-none"
                              : "hover:underline cursor-pointer"
                          }`}
                        >
                          <span className={`transition-opacity duration-300 ${
                            isRedirecting ? "opacity-0" : "opacity-100"
                          }`}>
                            Don't have a subscription ID? Get one here ↗
                          </span>

                          {/* Modern Loading Spinner */}
                          {isRedirecting && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-2 text-purple-600">
                                <div className="relative">
                                  {/* Outer spinning ring */}
                                  <div className="w-4 h-4 border-2 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
                                  {/* Inner pulsing dot */}
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-purple-600 rounded-full animate-pulse"></div>
                                </div>
                                <span className="text-xs font-medium animate-pulse">
                                  Opening subscription portal...
                                </span>
                                {/* Animated dots */}
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hover glow effect */}
                          <div className={`absolute inset-0 rounded-md transition-all duration-300 ${
                            !isRedirecting
                              ? "group-hover:bg-purple-50 group-hover:scale-105"
                              : "bg-purple-50 scale-105"
                          }`}></div>
                        </a>
                      </div>

                      {subscriptionValidation.message && (
                        <div
                          className={`text-xs ${
                            subscriptionValidation.isValid === true
                              ? "text-green-600"
                              : subscriptionValidation.isValid === false
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {subscriptionValidation.message}
                        </div>
                      )}

                      {subscriptionValidation.isValid === true &&
                        subscriptionValidation.userName && (
                          <div className="mt-3">
                            {/* Owner Name Display in Green */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-lg font-semibold text-green-700">
                                {subscriptionValidation.userName}
                              </span>
                              <span className="text-sm text-green-600">
                                (Verified Owner)
                              </span>
                            </div>

                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-green-800">
                                  ✓ HYBE Subscription Verified
                                </span>
                              </div>
                              <p className="text-xs text-green-600">
                                Your subscription benefits will be automatically
                                applied to your booking.
                              </p>
                            </div>
                          </div>
                        )}

                      {subscriptionValidation.isValid === true &&
                        subscriptionValidation.subscriptionType && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={
                                subscriptionValidation.subscriptionType ===
                                "premium"
                                  ? "default"
                                  : subscriptionValidation.subscriptionType ===
                                      "elite"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {subscriptionValidation.subscriptionType.toUpperCase()}{" "}
                              MEMBER
                            </Badge>
                            {subscriptionValidation.subscriptionType ===
                              "premium" && (
                              <span className="text-xs text-yellow-600">
                                🎯 Priority booking & 15% discount
                              </span>
                            )}
                            {subscriptionValidation.subscriptionType ===
                              "elite" && (
                              <span className="text-xs text-purple-600">
                                ⭐ Fast-track booking & 10% discount
                              </span>
                            )}
                            {subscriptionValidation.subscriptionType ===
                              "standard" && (
                              <span className="text-xs text-blue-600">
                                ✨ Standard member benefits
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="requests"
                        className="text-base font-semibold"
                      >
                        Special Requests
                      </Label>
                      <Textarea
                        id="requests"
                        placeholder="Any specific requirements or special requests for your event..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Contact Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            required
                            value={contactInfo.name}
                            onChange={(e) =>
                              setContactInfo({
                                ...contactInfo,
                                name: e.target.value,
                              })
                            }
                            className="h-12 mobile-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="email"
                              type="email"
                              required
                              value={contactInfo.email}
                              onChange={(e) =>
                                setContactInfo({
                                  ...contactInfo,
                                  email: e.target.value,
                                })
                              }
                              className="h-12 mobile-input"
                              disabled={otpState.otpSent || otpState.isVerified}
                            />
                            {!otpState.isVerified && (
                              <Button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={
                                  otpState.isSending ||
                                  !contactInfo.email.includes("@")
                                }
                                className="h-12"
                              >
                                {otpState.isSending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : otpState.otpSent ? (
                                  "Resend"
                                ) : (
                                  "Send OTP"
                                )}
                              </Button>
                            )}
                          </div>
                          {otpState.otpSent && !otpState.isVerified && (
                            <div className="space-y-2 pt-2">
                              <Label htmlFor="otp">Enter OTP</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="otp"
                                  type="text"
                                  maxLength={6}
                                  value={otpState.otp}
                                  onChange={(e) =>
                                    setOtpState((prev) => ({
                                      ...prev,
                                      otp: e.target.value,
                                    }))
                                  }
                                  className="h-12"
                                />
                                <Button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  disabled={
                                    otpState.isVerifying ||
                                    otpState.otp.length !== 6
                                  }
                                  className="h-12"
                                >
                                  {otpState.isVerifying ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Verify"
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {otpState.message && (
                            <p
                              className={`text-sm ${otpState.isVerified ? "text-green-600" : "text-red-600"}`}
                            >
                              {otpState.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            required
                            value={contactInfo.phone}
                            onChange={(e) =>
                              setContactInfo({
                                ...contactInfo,
                                phone: e.target.value,
                              })
                            }
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization">
                            Organization (Optional)
                          </Label>
                          <Input
                            id="organization"
                            value={contactInfo.organization}
                            onChange={(e) =>
                              setContactInfo({
                                ...contactInfo,
                                organization: e.target.value,
                              })
                            }
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Privacy Consent */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="privacy"
                        checked={privacyConsent}
                        onCheckedChange={(checked) =>
                          setPrivacyConsent(checked as boolean)
                        }
                      />
                      <Label htmlFor="privacy" className="text-sm">
                        I agree to HYBE's privacy policy and terms of service *
                      </Label>
                    </div>

                    {/* Success/Error Message */}
                    {submitMessage && (
                      <div
                        className={`p-4 rounded-lg border ${
                          submitSuccess
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <p className="text-sm font-medium">{submitMessage}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-hybe-purple to-hybe-pink hover:from-purple-700 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
                      disabled={
                        !privacyConsent ||
                        isSubmitting ||
                        !otpState.isVerified ||
                        (budget === "custom" && !customAmount)
                      }
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {loadingStep}
                        </div>
                      ) : (
                        "Submit Booking Request"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="space-y-6">
              {/* Event Types */}
              <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">
                    Experience Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventTypes.map((event) => (
                    <div
                      key={event.name}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <event.icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {event.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.duration}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pricing Info */}
              <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">
                    Artist Tiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">
                        Premium Tier
                      </h4>
                    </div>
                    <p className="text-sm text-yellow-700">
                      $750,000 - $1,000,000+
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      BLACKPINK, SEVENTEEN
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-800">
                        Elite Tier
                      </h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      $500,000 - $750,000
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      NewJeans, LE SSERAFIM, TWICE, Stray Kids
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">
                        Standard Tier
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700">$22,500 - $500,000</p>
                    <p className="text-xs text-blue-600 mt-1">
                      BTS, IVE, Rising Artists
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Benefits */}
              <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-center">
                    Subscription Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800 text-sm">
                        Premium Members
                      </h4>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Priority booking queue</li>
                      <li>• 15% discount on all bookings</li>
                      <li>• Exclusive artist meet opportunities</li>
                      <li>• VIP customer support</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-purple-600" />
                      <h4 className="font-semibold text-purple-800 text-sm">
                        Elite Members
                      </h4>
                    </div>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• Fast-track booking process</li>
                      <li>• 10% discount on bookings</li>
                      <li>• Early access to new artists</li>
                      <li>• Priority customer support</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-800 text-sm">
                        Standard Members
                      </h4>
                    </div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Member-only event notifications</li>
                      <li>• Access to exclusive content</li>
                      <li>• Standard booking process</li>
                      <li>• Community forum access</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-center">
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Our celebrity booking specialists are available 24/7 to
                    assist with your request.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Phone:</strong> +1 (555) 123-HYBE
                    </p>
                    <p>
                      <strong>Email:</strong> bookings@hybe.com
                    </p>
                    <p>
                      <strong>Emergency:</strong> +1 (555) 999-HYBE
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Consent */}
      <CookieConsent />
    </Layout>
  );
}
