import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define types
interface AdminTier {
  id: string;
  max_groups: number;
  tier_name: string;
}

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
  cycleDuration: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Cycle duration must be greater than 0",
  }),
  cycleStartDate: z.date({
    required_error: "Please select a start date",
  }),
  description: z.string().optional(),
});

interface CreateThriftSystemProps {
  open: boolean;
  onClose: () => void;
}

const CreateThriftSystem = ({ open, onClose }: CreateThriftSystemProps) => {
  const navigate = useNavigate();
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contributionAmount: "",
      payoutSchedule: "",
      maxMembers: "",
      cycleDuration: "",
      description: "",
    },
  });
  
  // Format currency input
  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Fetch admin tier and current group count
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminTierCheck'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const { data: tier, error: tierError } = await supabase
        .from('admin_tiers')
        .select('*')
        .eq('id', user.id)
        .single();
      if (tierError) throw tierError;
      
      const { count, error: countError } = await supabase
        .from('thrift_systems')
        .select('*', { count: 'exact' })
        .eq('admin_id', user.id);
      if (countError) throw countError;
      
      return { 
        tier: tier as AdminTier, 
        count: count || 0,
        user
      };
    }
  });

  const hasReachedLimit = data?.count >= (data?.tier?.max_groups || 0);

  // Mutation using useMutation hook with backend stored procedure
  const createThriftSystemMutation = useMutation(
    async (values: z.infer<typeof formSchema>) => {
      if (hasReachedLimit) {
        throw new Error("You've reached your maximum allowed thrift systems. Please upgrade your plan to create more.");
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Call the stored procedure that performs the transaction
      const { data, error } = await supabase.rpc('create_thrift_system_with_membership', {
        p_name: values.name,
        p_contribution_amount: Number(values.contributionAmount.replace(/,/g, "")),
        p_payout_schedule: values.payoutSchedule,
        p_max_members: Number(values.maxMembers),
        p_cycle_duration: Number(values.cycleDuration),
        p_cycle_start_date: values.cycleStartDate.toISOString(),
        p_description: values.description || null,
        p_admin_id: userData.user.id
      });
      
      if (error) throw error;
      
      // Fetch the new system record
      const { data: newSystem, error: fetchError } = await supabase
        .from('thrift_systems')
        .select('*')
        .eq('id', data)
        .single();
        
      if (fetchError) throw fetchError;
      
      return newSystem;
    }
  );

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    createThriftSystemMutation.mutate(values, {
      onSuccess: (newSystem) => {
        toast.success("Thrift system created successfully!");
        onClose();
        navigate(`/thrift-system/${newSystem.id}`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create thrift system. Please try again.");
      },
    });
  };

  // Handle formatted contribution amount input
  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    form.setValue("contributionAmount", formatted);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Thrift System</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your account information...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error loading your account information. Please try again later.
              {error instanceof Error && <p className="text-xs mt-1">{error.message}</p>}
            </AlertDescription>
          </Alert>
        ) : hasReachedLimit ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your limit of {data?.tier?.max_groups} thrift systems for your {data?.tier?.tier_name} tier.
              Please upgrade your plan to create more thrift systems.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thrift System Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormDescription>Give your thrift system a descriptive name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Amount (₦)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">₦</span>
                        <Input 
                          type="text" 
                          className="pl-8" 
                          placeholder="0" 
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e);
                            handleContributionChange(e);
                          }} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Amount each member contributes per cycle</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cycleDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle Duration (months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter duration" {...field} />
                      </FormControl>
                      <FormDescription>Length of one complete cycle</FormDescription>
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
                      <FormDescription>Total members allowed to join</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <FormDescription>How often payouts occur</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cycleStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>When the first cycle begins</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description or rules" className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>Additional details about this thrift system</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose} disabled={createThriftSystemMutation.isLoading}>Cancel</Button>
                <Button type="submit" disabled={createThriftSystemMutation.isLoading || hasReachedLimit}>
                  {createThriftSystemMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : 'Create Thrift System'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateThriftSystem;