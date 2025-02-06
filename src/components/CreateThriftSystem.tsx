import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  contributionAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Must be a valid amount greater than 0",
  }),
  payoutSchedule: z.string({
    required_error: "Please select a payout schedule",
  }),
  maxMembers: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 1, {
    message: "Must have at least 2 members",
  }),
  description: z.string().optional(),
});

interface CreateThriftSystemProps {
  open: boolean;
  onClose: () => void;
}

const CreateThriftSystem = ({ open, onClose }: CreateThriftSystemProps) => {
  const navigate = useNavigate();
  const [adminTier, setAdminTier] = useState<any>(null);
  const [currentGroupCount, setCurrentGroupCount] = useState(0);

  // Fetch admin tier and current group count
  useQuery({
    queryKey: ['adminTierCheck'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get admin profile with tier
      const { data: adminProfile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('tier_id')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      // Get tier details
      const { data: tier, error: tierError } = await supabase
        .from('admin_tiers')
        .select('*')
        .eq('id', adminProfile.tier_id)
        .single();
      if (tierError) throw tierError;

      // Get current group count
      const { count, error: countError } = await supabase
        .from('thrift_systems')
        .select('*', { count: 'exact' })
        .eq('admin_id', user.id);
      if (countError) throw countError;

      setAdminTier(tier);
      setCurrentGroupCount(count || 0);
      return { tier, count };
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contributionAmount: "",
      payoutSchedule: "",
      maxMembers: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (currentGroupCount >= adminTier?.max_groups) {
      toast.error(`You have reached the maximum number of groups (${adminTier.max_groups}) for your tier. Please upgrade to create more groups.`);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('thrift_systems')
        .insert({
          name: values.name,
          contribution_amount: Number(values.contributionAmount),
          payout_schedule: values.payoutSchedule,
          max_members: Number(values.maxMembers),
          description: values.description || null,
          admin_id: userData.user.id,
          status: 'active',
          admin_tier_id: adminTier.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Thrift system created successfully!");
      onClose();
      navigate(`/thrift-system/${data.id}`);
    } catch (error) {
      console.error("Error creating thrift system:", error);
      toast.error("Failed to create thrift system. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Thrift System</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thrift System Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contributionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payoutSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout Schedule</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Members</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter max members" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description or rules"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Thrift System</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThriftSystem;
