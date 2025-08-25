import { RequestHandler } from "express";
import { Analytics } from "../utils/logger";
import { sqliteDb, BookingRecord } from "../utils/sqlite-db";

export interface BookingRequest {
  fanPreference?: string;
  selectedCelebrity: string;
  selectedEventType: string;
  budget: string;
  customAmount?: string;
  attendees: string;
  preferredDate: string;
  location: string;
  specialRequests: string;
  subscriptionId?: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    organization?: string;
  };
  privacyConsent: boolean;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: string;
}

export const handleBookingSubmission: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  let netlifySubmissionSuccess = false;

  try {
    const bookingData: BookingRequest = req.body;

    // Validate required fields
    if (
      !bookingData.selectedCelebrity ||
      !bookingData.selectedEventType ||
      !bookingData.budget
    ) {
      Analytics.trackBookingSubmission({
        success: false,
        hasSubscription: !!bookingData.subscriptionId,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: "Missing required booking information",
      });
    }

    if (
      !bookingData.contactInfo.name ||
      !bookingData.contactInfo.email ||
      !bookingData.contactInfo.phone
    ) {
      Analytics.trackBookingSubmission({
        success: false,
        hasSubscription: !!bookingData.subscriptionId,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: "Missing required contact information",
      });
    }

    if (!bookingData.privacyConsent) {
      Analytics.trackBookingSubmission({
        success: false,
        hasSubscription: !!bookingData.subscriptionId,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: "Privacy consent is required",
      });
    }

    // Generate a booking ID
    const bookingId = `HYBE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Save to SQLite database first
    const bookingRecord: Omit<BookingRecord, "id" | "created_at"> = {
      booking_id: bookingId,
      celebrity: bookingData.selectedCelebrity,
      full_name: bookingData.contactInfo.name,
      email: bookingData.contactInfo.email,
      phone: bookingData.contactInfo.phone,
      organization: bookingData.contactInfo.organization,
      event_type: bookingData.selectedEventType,
      event_date: bookingData.preferredDate,
      location: bookingData.location,
      budget_range: bookingData.budget,
      custom_amount: bookingData.customAmount
        ? parseFloat(bookingData.customAmount)
        : undefined,
      attendees: bookingData.attendees,
      special_requests: bookingData.specialRequests,
      subscription_id: bookingData.subscriptionId,
      privacy_consent: bookingData.privacyConsent,
      status: "pending",
    };

    try {
      await sqliteDb.saveBooking(bookingRecord);
      console.info(`✅ Booking saved to SQLite: ${bookingId}`);
    } catch (sqliteError) {
      console.error("❌ Failed to save booking to SQLite:", sqliteError);
      // Continue with Netlify submission even if SQLite fails
    }

    // Prepare data for Netlify form submission
    const netlifyFormData = {
      "form-name": "hybe-booking",
      "booking-id": bookingId,
      "fan-preference": bookingData.fanPreference || "",
      celebrity: bookingData.selectedCelebrity,
      "event-type": bookingData.selectedEventType,
      budget: bookingData.budget,
      "custom-amount": bookingData.customAmount || "",
      attendees: bookingData.attendees,
      "preferred-date": bookingData.preferredDate,
      location: bookingData.location,
      "special-requests": bookingData.specialRequests,
      "subscription-id": bookingData.subscriptionId || "",
      "contact-name": bookingData.contactInfo.name,
      "contact-email": bookingData.contactInfo.email,
      "contact-phone": bookingData.contactInfo.phone,
      "contact-organization": bookingData.contactInfo.organization || "",
      "privacy-consent": String(bookingData.privacyConsent),
      "submission-time": new Date().toISOString(),
      "user-agent": req.headers["user-agent"] || "",
      "ip-address": req.ip || "",
    };

    // Submit to Netlify forms (this would work when deployed to Netlify)
    const netlifyStartTime = Date.now();
    try {
      if (process.env.NODE_ENV === "production") {
        const netlifyResponse = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(netlifyFormData).toString(),
        });

        netlifySubmissionSuccess = netlifyResponse.ok;

        if (!netlifyResponse.ok) {
          console.warn(
            "Netlify form submission failed, continuing with local processing",
          );
        }
      }
    } catch (netlifyError) {
      console.warn("Netlify form submission error:", netlifyError);
      // Continue with local processing even if Netlify submission fails
    }

    Analytics.trackPerformance(
      "netlify_form_submission",
      Date.now() - netlifyStartTime,
      {
        success: netlifySubmissionSuccess,
        bookingId,
      },
    );

    // Track successful booking analytics
    Analytics.trackBookingSubmission({
      artist: bookingData.selectedCelebrity,
      eventType: bookingData.selectedEventType,
      budget: bookingData.budget,
      hasSubscription: !!bookingData.subscriptionId,
      success: true,
      ip: req.ip,
    });

    // Track performance metrics
    Analytics.trackPerformance(
      "booking_submission_total",
      Date.now() - startTime,
      {
        bookingId,
        hasSubscription: !!bookingData.subscriptionId,
        netlifySuccess: netlifySubmissionSuccess,
      },
    );

    const response: BookingResponse = {
      success: true,
      message:
        "Your booking request has been submitted successfully! Our team will contact you within 24 hours.",
      bookingId,
    };

    res.json(response);
  } catch (error) {
    Analytics.trackError(error as Error, "booking_submission", {
      ip: req.ip,
      hasSubscription: !!req.body?.subscriptionId,
      duration: Date.now() - startTime,
      netlifySuccess: netlifySubmissionSuccess,
    });

    Analytics.trackBookingSubmission({
      success: false,
      hasSubscription: !!req.body?.subscriptionId,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message:
        "An error occurred while processing your booking request. Please try again.",
    });
  }
};
