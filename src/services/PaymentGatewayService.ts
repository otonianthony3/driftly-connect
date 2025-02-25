
import { supabase } from "@/integrations/supabase/client";

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'mobile_money' | 'crypto';
  last4: string;
  expiry?: string;
  brand?: string;
  name?: string;
  is_default: boolean;
  user_id: string;
}

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

// Main service class for handling payment gateway operations
export class PaymentGatewayService {
  private gateway: SupportedGateway;
  private config: PaymentGatewayConfig;

  constructor(gateway: SupportedGateway, config: PaymentGatewayConfig) {
    this.gateway = gateway;
    this.config = config;
  }

  // Initialize payment gateway based on configuration
  static async initialize(gateway: SupportedGateway): Promise<PaymentGatewayService> {
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

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Initiate a payment through the selected gateway
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`Initiating payment via ${this.gateway} gateway`, request);

    // In a real implementation, we would make actual API calls to the payment gateway
    // For demo purposes, we're simulating a successful payment response

    // Record the payment attempt in the database
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User not authenticated');
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          user_id: session.session.user.id,
          payment_method_id: request.payment_method_id,
          contribution_id: request.contribution_id,
          gateway: this.gateway,
          status: 'pending',
          metadata: request.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate payment gateway response
      // In a real implementation, we would return data from the actual gateway
      return {
        id: payment.id,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      // In a real implementation, we would make an API call to the payment gateway
      // For demo purposes, we're simulating a response

      // Get the payment from the database
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;

      // Simulate successful payment verification (80% chance of success)
      const isSuccessful = Math.random() < 0.8;
      const newStatus = isSuccessful ? 'succeeded' : 'failed';

      // Update the payment status in the database
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) throw updateError;

      // If payment was successful and linked to a contribution, update the contribution
      if (isSuccessful && payment.contribution_id) {
        await this.updateContributionOnPaymentSuccess(payment.contribution_id);
      }

      return {
        id: updatedPayment.id,
        status: updatedPayment.status as 'pending' | 'processing' | 'succeeded' | 'failed',
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        created_at: updatedPayment.created_at,
        updated_at: updatedPayment.updated_at,
        error_message: isSuccessful ? undefined : 'Payment verification failed',
        gateway_reference: updatedPayment.gateway_reference
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Add a new payment method
  async addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'user_id' | 'is_default'>): Promise<PaymentMethod> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User not authenticated');
      }

      // Check if this is the first payment method (should be default)
      const { data: existing } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', session.session.user.id);

      const isDefault = !existing || existing.length === 0;

      // Insert the new payment method
      const { data: paymentMethod, error } = await supabase
        .from('payment_methods')
        .insert({
          ...data,
          user_id: session.session.user.id,
          is_default: isDefault
        })
        .select()
        .single();

      if (error) throw error;
      return paymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Update contribution status when payment is successful
  private async updateContributionOnPaymentSuccess(contributionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contributions')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString()
        })
        .eq('id', contributionId);

      if (error) throw error;
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
