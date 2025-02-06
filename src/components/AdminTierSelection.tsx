import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check, Star, Crown, BadgeCheck, Megaphone, LineChart, Wallet, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AdminTierFeatures {
  can_create_groups: boolean;
  max_members_per_group: number;
  verification_eligible: boolean;
  can_promote_groups: boolean;
  support_priority: 'standard' | 'high' | 'priority';
  analytics: boolean;
  featured_listing?: boolean;
  custom_branding?: boolean;
  transaction_fees: {
    enabled: boolean;
    threshold: number;
    percentage: number;
  };
  advanced_tools: {
    enabled: boolean;
    features: string[];
  };
}

interface AdminTier {
  id: string;
  name: string;
  max_groups: number;
  price: number;
  features: AdminTierFeatures;
  created_at: string;
}

interface AdminTierSelectionProps {
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
}

export function AdminTierSelection({ selectedTierId, onSelectTier }: AdminTierSelectionProps) {
  const { data: tiers, isLoading } = useQuery({
    queryKey: ['adminTiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_tiers')
        .select('*')
        .order('price');
      
      if (error) throw error;
      
      // Safely cast the features JSON to our AdminTierFeatures type
      return (data as any[]).map(tier => ({
        ...tier,
        features: tier.features as AdminTierFeatures
      })) as AdminTier[];
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tiers?.map((tier) => (
        <Card 
          key={tier.id}
          className={`relative ${selectedTierId === tier.id ? 'border-primary' : ''}`}
        >
          {tier.price === 0 && (
            <div className="absolute -top-2 -right-2">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Free
              </span>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tier.name === 'Basic' && <Shield className="h-5 w-5" />}
                {tier.name === 'Premium' && <Star className="h-5 w-5 text-yellow-500" />}
                {tier.name === 'Enterprise' && <Crown className="h-5 w-5 text-purple-500" />}
                <CardTitle>{tier.name}</CardTitle>
              </div>
              {tier.features.verification_eligible && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BadgeCheck className="h-4 w-4" />
                  Verification
                </Badge>
              )}
            </div>
            <CardDescription>
              Up to {tier.max_groups} groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              ₦{tier.price.toLocaleString()}
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Create up to {tier.max_groups} groups
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Up to {tier.features.max_members_per_group} members per group
              </li>
              {tier.features.verification_eligible && (
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                  Verification badge eligibility
                </li>
              )}
              {tier.features.can_promote_groups && (
                <li className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-purple-500" />
                  Promote groups in search
                </li>
              )}
              {tier.features.featured_listing && (
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Featured listings
                </li>
              )}
              {tier.features.transaction_fees.enabled && (
                <li className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {tier.features.transaction_fees.percentage}% fee on pools over ₦{tier.features.transaction_fees.threshold.toLocaleString()}
                </li>
              )}
              {tier.features.advanced_tools.enabled && (
                <li className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-indigo-500" />
                  Advanced admin tools
                </li>
              )}
              {tier.features.analytics && (
                <li className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-blue-500" />
                  Advanced analytics & reports
                </li>
              )}
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {tier.features.support_priority} support
              </li>
              {tier.features.custom_branding && (
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Custom branding
                </li>
              )}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              variant={selectedTierId === tier.id ? "default" : "outline"}
              onClick={() => onSelectTier(tier.id)}
            >
              {selectedTierId === tier.id ? "Selected" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
