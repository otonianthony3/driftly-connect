import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { User } from "@/types/user";

interface SubscriptionTabProps {
  user: User;
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your subscription plan and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CurrentPlan user={user} />
        <AvailablePlans currentPlan={user.subscription_plan} />
        <BillingInformation />
      </CardContent>
    </Card>
  );
};

interface CurrentPlanProps {
  user: User;
}

const CurrentPlan: React.FC<CurrentPlanProps> = ({ user }) => {
  return (
    <div className="bg-muted p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Current Plan</h3>
        <Badge className="text-sm capitalize">
          {user.subscription_status || "active"}
        </Badge>
      </div>
      <div className="mb-4">
        <h4 className="text-2xl font-bold capitalize">{user.subscription_plan || "Free"}</h4>
        {user.subscription_renewal && (
          <p className="text-sm text-muted-foreground">
            Renews on {user.subscription_renewal}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {user.subscription_plan !== "enterprise" && (
          <Button variant="default">Upgrade Plan</Button>
        )}
        {user.subscription_plan !== "free" && user.subscription_status === "active" && (
          <Button variant="outline">Cancel Plan</Button>
        )}
      </div>
    </div>
  );
};

interface AvailablePlansProps {
  currentPlan?: string;
}

const AvailablePlans: React.FC<AvailablePlansProps> = ({ currentPlan }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Available Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlanCard 
          title="Free"
          description="Basic features for personal use"
          price="$0"
          features={["Limited storage", "Basic features", "Community support"]}
          isCurrentPlan={currentPlan === 'free'}
        />
        <PlanCard 
          title="Basic"
          description="Enhanced features for individuals"
          price="$9.99"
          features={["Increased storage", "Advanced features", "Email support"]}
          isCurrentPlan={currentPlan === 'basic'}
        />
        <PlanCard 
          title="Premium"
          description="Professional features for power users"
          price="$19.99"
          features={["Unlimited storage", "Premium features", "Priority support"]}
          isCurrentPlan={currentPlan === 'premium'}
        />
      </div>
    </div>
  );
};

interface PlanCardProps {
  title: string;
  description: string;
  price: string;
  features: string[];
  isCurrentPlan: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  description,
  price,
  features,
  isCurrentPlan
}) => {
  return (
    <Card className={`border ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold mb-4">{price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
        <ul className="space-y-2 text-sm">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const BillingInformation: React.FC = () => {
  return (
    <div className="border-t pt-4">
      <h3 className="text-lg font-medium mb-4">Billing Information</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Payment Method</h4>
          <div className="flex items-center p-3 border rounded-md">
            <div className="mr-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Visa ending in 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/2025</p>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Billing Address</h4>
          <div className="p-3 border rounded-md">
            <p>123 Main St.</p>
            <p>San Francisco, CA 94103</p>
            <p>United States</p>
            <Button variant="ghost" size="sm" className="mt-2 px-0">Edit Address</Button>
          </div>
        </div>
        <div>
          <Button variant="outline">View Billing History</Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;
