import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check, Star, Crown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[300px]" />
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
            <CardTitle className="flex items-center gap-2">
              {tier.name === 'Basic' && <Shield className="h-5 w-5" />}
              {tier.name === 'Premium' && <Star className="h-5 w-5" />}
              {tier.name === 'Enterprise' && <Crown className="h-5 w-5" />}
              {tier.name}
            </CardTitle>
            <CardDescription>
              Up to {tier.max_groups} groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              ₦{tier.price.toLocaleString()}
            </div>
            <ul className="space-y-2">
              {Object.entries(tier.features).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  {value ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  {key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </li>
              ))}
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