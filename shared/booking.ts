export interface BookingRequest {
  selectedCelebrity: string;
  selectedEventType: string;
  budget: string;
  attendees: string;
  preferredDate: string;
  location: string;
  specialRequests: string;
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
