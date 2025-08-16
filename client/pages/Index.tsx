import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CalendarDays, Star, Users, MapPin, Heart, Crown, Sparkles, Music } from "lucide-react";

const celebrities = [
  { name: "BTS", category: "Group", tier: "Premium", price: "1,000,000" },
  { name: "BLACKPINK", category: "Group", tier: "Premium", price: "800,000" },
  { name: "NewJeans", category: "Group", tier: "Elite", price: "600,000" },
  { name: "LE SSERAFIM", category: "Group", tier: "Elite", price: "550,000" },
  { name: "SEVENTEEN", category: "Group", tier: "Premium", price: "750,000" },
  { name: "TWICE", category: "Group", tier: "Elite", price: "650,000" },
  { name: "Stray Kids", category: "Group", tier: "Elite", price: "500,000" },
  { name: "IVE", category: "Group", tier: "Standard", price: "400,000" },
];

const eventTypes = [
  { name: "Meet & Greet", description: "Personal interaction with your favorite artist", icon: Heart, duration: "30-60 min" },
  { name: "Private Event", description: "Exclusive performance for your special occasion", icon: Crown, duration: "2-4 hours" },
  { name: "Vacation Package", description: "Travel experience with celebrity appearances", icon: MapPin, duration: "3-7 days" },
  { name: "Studio Session", description: "Behind-the-scenes studio experience", icon: Music, duration: "4-8 hours" },
];

export default function Index() {
  const [selectedCelebrity, setSelectedCelebrity] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [budget, setBudget] = useState("");
  const [attendees, setAttendees] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [location, setLocation] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    organization: ""
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Booking submitted:", {
      selectedCelebrity,
      selectedEventType,
      budget,
      attendees,
      preferredDate,
      location,
      specialRequests,
      contactInfo,
      privacyConsent
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hybe-purple via-purple-600 to-hybe-pink">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-6 py-12 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              HYBE CELEBRITY BOOKING
            </h1>
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Book exclusive experiences with the world's biggest K-pop stars. From intimate meet & greets to luxury vacation packages.
          </p>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-purple-200">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Premium Artists</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Exclusive Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span>VIP Treatment</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Booking Form */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">Book Your Experience</CardTitle>
              <CardDescription className="text-lg">
                Fill out the form below to request a custom booking with your chosen artist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Celebrity Selection */}
                <div className="space-y-2">
                  <Label htmlFor="celebrity" className="text-base font-semibold">Select Artist</Label>
                  <Select value={selectedCelebrity} onValueChange={setSelectedCelebrity}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your preferred artist" />
                    </SelectTrigger>
                    <SelectContent>
                      {celebrities.map((celebrity) => (
                        <SelectItem key={celebrity.name} value={celebrity.name}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{celebrity.name}</span>
                            <div className="flex items-center gap-2 ml-4">
                              <Badge variant={celebrity.tier === "Premium" ? "default" : celebrity.tier === "Elite" ? "secondary" : "outline"} className="text-xs">
                                {celebrity.tier}
                              </Badge>
                              <span className="text-xs text-muted-foreground">from ${celebrity.price}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="eventType" className="text-base font-semibold">Event Type</Label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((event) => (
                        <SelectItem key={event.name} value={event.name}>
                          <div className="flex items-center gap-3">
                            <event.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-muted-foreground">{event.duration}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Range */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-base font-semibold">Budget Range (USD)</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22500-50000">$22,500 - $50,000</SelectItem>
                      <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                      <SelectItem value="100000-250000">$100,000 - $250,000</SelectItem>
                      <SelectItem value="250000-500000">$250,000 - $500,000</SelectItem>
                      <SelectItem value="500000-750000">$500,000 - $750,000</SelectItem>
                      <SelectItem value="750000-1000000">$750,000 - $1,000,000</SelectItem>
                      <SelectItem value="1000000+">$1,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendees" className="text-base font-semibold">Number of Attendees</Label>
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
                    <Label htmlFor="date" className="text-base font-semibold">Preferred Date</Label>
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
                  <Label htmlFor="location" className="text-base font-semibold">Location/Venue</Label>
                  <Input
                    id="location"
                    placeholder="City, Country or specific venue"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests" className="text-base font-semibold">Special Requests</Label>
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
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={contactInfo.name}
                        onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        required
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization (Optional)</Label>
                      <Input
                        id="organization"
                        value={contactInfo.organization}
                        onChange={(e) => setContactInfo({...contactInfo, organization: e.target.value})}
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
                    onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-sm">
                    I agree to HYBE's privacy policy and terms of service *
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-hybe-purple to-hybe-pink hover:from-purple-700 hover:to-pink-600 transition-all duration-300"
                  disabled={!privacyConsent}
                >
                  Submit Booking Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Information Panel */}
          <div className="space-y-8">
            {/* Event Types */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Experience Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventTypes.map((event) => (
                  <div key={event.name} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                    <div className="p-2 rounded-lg bg-white shadow-sm">
                      <event.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {event.duration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Artist Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-800">Premium Tier</h4>
                  </div>
                  <p className="text-sm text-yellow-700">$750,000 - $1,000,000+</p>
                  <p className="text-xs text-yellow-600 mt-1">BTS, BLACKPINK, SEVENTEEN</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">Elite Tier</h4>
                  </div>
                  <p className="text-sm text-purple-700">$500,000 - $750,000</p>
                  <p className="text-xs text-purple-600 mt-1">NewJeans, LE SSERAFIM, TWICE</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Standard Tier</h4>
                  </div>
                  <p className="text-sm text-blue-700">$200,000 - $500,000</p>
                  <p className="text-xs text-blue-600 mt-1">IVE, Stray Kids, Rising Artists</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-center">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Our celebrity booking specialists are available 24/7 to assist with your request.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Phone:</strong> +1 (555) 123-HYBE</p>
                  <p><strong>Email:</strong> bookings@hybe.com</p>
                  <p><strong>Emergency:</strong> +1 (555) 999-HYBE</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/80 text-white py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-6 w-6" />
            <span className="text-xl font-bold">HYBE CORPORATION</span>
          </div>
          <p className="text-gray-300 text-sm">
            © 2024 HYBE Corporation. All rights reserved. Connecting fans with their idols through unforgettable experiences.
          </p>
        </div>
      </footer>
    </div>
  );
}
