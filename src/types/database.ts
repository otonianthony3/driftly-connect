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