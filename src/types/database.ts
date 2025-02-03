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
}

export interface Membership {
  id: string;
  thrift_system_id: string | null;
  user_id: string | null;
  status: string;
  join_date: string | null;
  role: string;
}