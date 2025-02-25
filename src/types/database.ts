
export interface ThriftSystem {
  id: string;
  name: string;
  contribution_amount: number;
  payout_schedule: string;
  max_members: number;
  description: string | null;
  admin_id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  admin_tier_id: string | null;
  memberships?: Membership[];
}

export interface Membership {
  id: string;
  thrift_system_id: string;
  user_id: string | null;
  status: string;
  join_date: string | null;
  role: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank_account' | 'mobile_money' | 'crypto';
  last4: string;
  expiry?: string;
  brand?: string;
  name?: string;
  is_default: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  payment_method_id?: string;
  gateway: string;
  gateway_reference?: string;
  contribution_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ContributionWithSystem {
  amount: number;
  status: string;
  created_at: string;
  thrift_systems: {
    name: string;
  };
}

export interface PayoutWithSystem {
  amount: number;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  thrift_systems: {
    name: string;
  };
}

export interface ContributionWithMember {
  amount: number;
  status: string;
  created_at: string;
  memberships: {
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}

export interface PayoutWithMember {
  amount: number;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  member: {
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}
