export interface SubscriptionValidationRequest {
  subscriptionId: string;
}

export interface SubscriptionValidationResponse {
  isValid: boolean;
  subscriptionType?: string;
  userName?: string;
  message: string;
}

export interface SubscriptionTypesResponse {
  subscriptionTypes: Array<{
    subscription_type: string;
    count: string;
  }>;
  totalActive: number;
}
