
import { supabase } from "@/integrations/supabase/client";
import { PaymentMethod, Payment } from "@/types/database";

export type { PaymentMethod };

export interface PaymentGatewayConfig {
  apiKey: string;
  environment: 'test' | 'production';
  merchantId?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  payment_method_id?: string;
  return_url?: string;
  contribution_id?: string;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  payment_method?: Partial<PaymentMethod>;
  created_at: string;
  updated_at: string;
  error_message?: string;
  gateway_reference?: string;
  checkout_url?: string;
}

export type SupportedGateway = 'paystack' | 'flutterwave' | 'stripe';

// In-memory storage for mock data
const mockPaymentMethods: PaymentMethod[] = [];
const mockPayments: Payment[] = [];

// Main service class for handling payment gateway operations
export class PaymentGatewayService {
  private gateway: SupportedGateway;
  private config: PaymentGatewayConfig;

  constructor(gateway: SupportedGateway, config: PaymentGatewayConfig) {
    this.gateway = gateway;
    this.config = config;
  }

  // Initialize payment gateway based on configuration
  static async initialize(gateway: SupportedGateway = 'paystack'): Promise<PaymentGatewayService> {
    // In a real implementation, we would fetch the API keys from secure storage
    // For demo purposes, we're using dummy values
    const config: Record<SupportedGateway, PaymentGatewayConfig> = {
      paystack: {
        apiKey: 'pk_test_paystack_key',
        environment: 'test',
      },
      flutterwave: {
        apiKey: 'pk_test_flutterwave_key',
        environment: 'test',
      },
      stripe: {
        apiKey: 'pk_test_stripe_key',
        environment: 'test',
      },
    };

    return new PaymentGatewayService(gateway, config[gateway]);
  }

  // Get saved payment methods for a user
  async getUserPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User not authenticated');
      }
      
      // In a real application, we would query the database
      // For demo purposes, we'll return mock data
      return mockPaymentMethods.filter(method => method.user_id === session.session.user.id);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Initiate a payment through the selected gateway
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`Initiating payment via ${this.gateway} gateway`, request);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User not authenticated');
      }

      // Generate a unique ID for the payment
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create a payment record
      const payment: Payment = {
        id: paymentId,
        user_id: session.session.user.id,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        status: 'pending',
        payment_method_id: request.payment_method_id,
        gateway: this.gateway,
        contribution_id: request.contribution_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: request.metadata
      };
      
      // Store payment in mock database
      mockPayments.push(payment);

      // Return payment response
      return {
        id: payment.id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        checkout_url: `https://example.com/checkout/${payment.id}`,
        gateway_reference: `${this.gateway}_${Math.random().toString(36).substring(2, 15)}`
      };
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    console.log(`Verifying payment ${paymentId} via ${this.gateway} gateway`);

    try {
      // Find the payment in our mock database
      const payment = mockPayments.find(p => p.id === paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Simulate successful payment verification (80% chance of success)
      const isSuccessful = Math.random() < 0.8;
      const newStatus = isSuccessful ? 'succeeded' as const : 'failed' as const;

      // Update the payment status
      payment.status = newStatus;
      payment.updated_at = new Date().toISOString();

      // If payment was successful and linked to a contribution, update the contribution
      if (isSuccessful && payment.contribution_id) {
        await this.updateContributionOnPaymentSuccess(payment.contribution_id);
      }

      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        error_message: isSuccessful ? undefined : 'Payment verification failed',
        gateway_reference: payment.gateway_reference
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Add a new payment method
  async addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'user_id' | 'is_default' | 'created_at'>): Promise<PaymentMethod> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User not authenticated');
      }

      // Check if this is the first payment method (should be default)
      const existingMethods = mockPaymentMethods.filter(m => m.user_id === session.session.user.id);
      const isDefault = existingMethods.length === 0;

      // Create a new payment method
      const paymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        user_id: session.session.user.id,
        is_default: isDefault,
        created_at: new Date().toISOString(),
        ...data
      };
      
      // Store in mock database
      mockPaymentMethods.push(paymentMethod);
      
      return paymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Update contribution status when payment is successful
  private async updateContributionOnPaymentSuccess(contributionId: string): Promise<void> {
    try {
      console.log(`Updating contribution ${contributionId} after successful payment`);
      // In a real application, we would update the contribution in the database
      // For demo purposes, we'll just log this action
    } catch (error) {
      console.error('Error updating contribution status:', error);
    }
  }
}

// Singleton instance for easy access throughout the app
let gatewayInstance: PaymentGatewayService | null = null;

// Initialize with default gateway
export const initializePaymentGateway = async (gateway: SupportedGateway = 'paystack'): Promise<PaymentGatewayService> => {
  if (!gatewayInstance) {
    gatewayInstance = await PaymentGatewayService.initialize(gateway);
  }
  return gatewayInstance;
};

// Get the current gateway instance
export const getPaymentGateway = async (): Promise<PaymentGatewayService> => {
  if (!gatewayInstance) {
    return initializePaymentGateway();
  }
  return gatewayInstance;
};
