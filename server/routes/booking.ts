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

export const handleBookingSubmission: RequestHandler = async (req, res) => {
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

    // Prepare data for Netlify form submission
    const netlifyFormData = {
      "form-name": "hybe-booking",
      "booking-id": bookingId,
      "celebrity": bookingData.selectedCelebrity,
      "event-type": bookingData.selectedEventType,
      "budget": bookingData.budget,
      "custom-amount": bookingData.customAmount || "",
      "attendees": bookingData.attendees,
      "preferred-date": bookingData.preferredDate,
      "location": bookingData.location,
      "special-requests": bookingData.specialRequests,
      "subscription-id": bookingData.subscriptionId || "",
      "contact-name": bookingData.contactInfo.name,
      "contact-email": bookingData.contactInfo.email,
      "contact-phone": bookingData.contactInfo.phone,
      "contact-organization": bookingData.contactInfo.organization,
      "submission-time": new Date().toISOString()
    };

    // Submit to Netlify forms (this would work when deployed to Netlify)
    try {
      if (process.env.NODE_ENV === 'production') {
        const netlifyResponse = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(netlifyFormData).toString()
        });

        if (!netlifyResponse.ok) {
          console.warn('Netlify form submission failed, continuing with local processing');
        }
      }
    } catch (netlifyError) {
      console.warn('Netlify form submission error:', netlifyError);
      // Continue with local processing even if Netlify submission fails
    }

    // Log the booking for development/backup purposes
    console.log("New booking received:", {
      bookingId,
      celebrity: bookingData.selectedCelebrity,
      eventType: bookingData.selectedEventType,
      budget: bookingData.budget,
      customAmount: bookingData.customAmount,
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
