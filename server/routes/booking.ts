import { RequestHandler } from "express";

export interface BookingRequest {
  selectedCelebrity: string;
  selectedEventType: string;
  budget: string;
  attendees: string;
  preferredDate: string;
  location: string;
  specialRequests: string;
  subscriptionId?: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    organization: string;
  };
  privacyConsent: boolean;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: string;
}

export const handleBookingSubmission: RequestHandler = (req, res) => {
  try {
    const bookingData: BookingRequest = req.body;
    
    // Validate required fields
    if (!bookingData.selectedCelebrity || !bookingData.selectedEventType || !bookingData.budget) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking information"
      });
    }

    if (!bookingData.contactInfo.name || !bookingData.contactInfo.email || !bookingData.contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required contact information"
      });
    }

    if (!bookingData.privacyConsent) {
      return res.status(400).json({
        success: false,
        message: "Privacy consent is required"
      });
    }

    // Generate a booking ID
    const bookingId = `HYBE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // In a real application, you would:
    // 1. Save to database
    // 2. Send confirmation emails
    // 3. Notify booking team
    // 4. Process payment/deposit
    
    console.log("New booking received:", {
      bookingId,
      celebrity: bookingData.selectedCelebrity,
      eventType: bookingData.selectedEventType,
      budget: bookingData.budget,
      subscriptionId: bookingData.subscriptionId || "None",
      contact: bookingData.contactInfo.email,
      hasValidSubscription: !!bookingData.subscriptionId
    });

    const response: BookingResponse = {
      success: true,
      message: "Your booking request has been submitted successfully! Our team will contact you within 24 hours.",
      bookingId
    };

    res.json(response);
  } catch (error) {
    console.error("Booking submission error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking request. Please try again."
    });
  }
};
