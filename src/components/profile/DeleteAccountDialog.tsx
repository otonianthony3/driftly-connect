import { useState, useEffect } from "react";
import { supabase } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, AlertCircle, CheckCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface DeleteAccountDialogProps {
  userId: string;
  userEmail?: string;
  hasSubscription?: boolean;
  connectedServices?: string[];
  onAccountDeleted?: () => void;
}

interface DeletionReason {
  id: string;
  label: string;
}

const DELETION_REASONS: DeletionReason[] = [
  { id: "not-useful", label: "Not useful for me" },
  { id: "found-alternative", label: "Found a better alternative" },
  { id: "difficult", label: "Too difficult to use" },
  { id: "privacy", label: "Privacy concerns" },
  { id: "temporary", label: "Only needed temporarily" },
  { id: "bugs", label: "Too many bugs or issues" },
  { id: "expensive", label: "Too expensive" },
  { id: "other", label: "Other reason" },
];

// Recovery period in days
const RECOVERY_PERIOD = 14;

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  userId,
  userEmail = "",
  hasSubscription = false,
  connectedServices = [],
  onAccountDeleted,
}) => {
  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Confirmation inputs
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deletionReason, setDeletionReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  
  // Countdown timer
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);
  
  // Checklist states
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = useState(false);
  
  // Generate checklist items based on user profile
  const checklistItems = [
    { id: "data", label: "I understand all my data will be permanently deleted" },
    { id: "recovery", label: `I understand I have ${RECOVERY_PERIOD} days to recover my account` },
    ...(hasSubscription ? [{ id: "subscription", label: "I understand my subscription will be cancelled" }] : []),
    ...(connectedServices.length > 0 ? [{ id: "services", label: "I understand connected services may be affected" }] : []),
  ];

  // Handle checklist state
  useEffect(() => {
    const allItemsChecked = checklistItems.every(item => checkedItems[item.id]);
    setAllChecked(allItemsChecked);
  }, [checkedItems, checklistItems]);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, countdownActive]);

  // Reset dialog state when opened/closed
  useEffect(() => {
    if (!showDialog) {
      // Reset state when dialog closes
      setCurrentStep(1);
      setPassword("");
      setConfirmText("");
      setDeletionReason("");
      setOtherReason("");
      setCountdown(5);
      setCountdownActive(false);
      setCheckedItems({});
    }
  }, [showDialog]);

  const handleCheckItem = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    
    try {
      // Get user data from various tables
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (profileError) throw profileError;
      
      // Get any other related data from other tables
      // Example: Get user's posts, comments, etc.
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId);
        
      if (postsError) throw postsError;
      
      // Combine all data
      const userData = {
        profile: profileData,
        posts: postsData,
        // Add other data here
        exportDate: new Date().toISOString(),
      };
      
      // Create and download a JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-data-${userId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Your data has been downloaded successfully.");
    } catch (error: any) {
      toast.error(`Error downloading data: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      // Attempt to sign in with the provided credentials to verify the password
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      
      return !error;
    } catch (error) {
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    // Validate password
    const isPasswordValid = await verifyPassword(password);
    if (!isPasswordValid) {
      toast.error("Incorrect password. Please try again.");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Log deletion reason for analytics
      await supabase.from("account_deletion_analytics").insert({
        user_id: userId,
        reason: deletionReason === "other" ? otherReason : deletionReason,
        timestamp: new Date().toISOString(),
      });
      
      // Handle subscription cancellation if user has one
      if (hasSubscription) {
        // Call subscription cancellation API or service
        // This would depend on your payment provider (Stripe, etc.)
        // For example:
        // await cancelSubscription(userId);
      }
      
      // Instead of permanent deletion, mark the account for deletion with recovery period
      const deletionDate = new Date();
      const recoveryEndDate = new Date();
      recoveryEndDate.setDate(recoveryEndDate.getDate() + RECOVERY_PERIOD);
      
      const { error: markError } = await supabase
        .from("scheduled_deletions")
        .upsert({
          user_id: userId,
          scheduled_at: deletionDate.toISOString(),
          recovery_end_date: recoveryEndDate.toISOString(),
          reason: deletionReason === "other" ? otherReason : deletionReason,
          status: "pending"
        });
        
      if (markError) throw markError;
      
      // Disable user access but don't permanently delete yet
      const { error: disableError } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { account_disabled: true },
          app_metadata: { status: "scheduled_deletion" }
        }
      );
      
      if (disableError) throw disableError;
      
      // Sign out the user
      await supabase.auth.signOut();
      
      toast.success(`Your account has been scheduled for deletion. You have ${RECOVERY_PERIOD} days to recover it if needed.`);
      
      // Call the onAccountDeleted callback if provided
      if (onAccountDeleted) {
        onAccountDeleted();
      }
      
      setTimeout(() => {
        window.location.href = "/deletion-confirmation"; // Redirect to confirmation page
      }, 2000);
    } catch (error: any) {
      toast.error(`Error processing deletion: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const startDeletionCountdown = () => {
    setCountdownActive(true);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setShowDialog(true)}>
        Delete Account
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Your Account</DialogTitle>
            <DialogDescription>
              This action is irreversible after the recovery period ends.
            </DialogDescription>
          </DialogHeader>

          {currentStep === 1 && (
            <>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Deleting your account will remove all your data after the {RECOVERY_PERIOD}-day recovery period ends.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label htmlFor="deletion-reason">Why are you deleting your account?</Label>
                  <Select 
                    value={deletionReason} 
                    onValueChange={setDeletionReason}
                  >
                    <SelectTrigger id="deletion-reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELETION_REASONS.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {deletionReason === "other" && (
                  <div>
                    <Label htmlFor="other-reason">Please specify</Label>
                    <Textarea
                      id="other-reason"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Tell us why you're leaving..."
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={nextStep} disabled={!deletionReason || (deletionReason === "other" && !otherReason)}>
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Download Your Data</CardTitle>
                    <CardDescription>
                      Get a copy of all your personal data before deleting your account.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadData} 
                      disabled={isDownloading}
                      className="w-full"
                    >
                      {isDownloading ? "Downloading..." : "Download Your Data"}
                      <Download className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Please acknowledge the following:</h3>
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={item.id} 
                          checked={checkedItems[item.id] || false}
                          onCheckedChange={(checked) => handleCheckItem(item.id, checked === true)}
                        />
                        <Label htmlFor={item.id} className="text-sm">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} disabled={!allChecked}>
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                {connectedServices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Connected services that will be affected:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {connectedServices.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="confirm-password">Confirm your password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-text">Type "DELETE" to confirm</Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={startDeletionCountdown}
                    disabled={password === "" || confirmText !== "DELETE"}
                  >
                    Delete My Account
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {countdownActive && (
            <div className="mt-4 space-y-3">
              <Alert>
                <AlertTitle>Final Confirmation</AlertTitle>
                <AlertDescription>
                  Your account will be scheduled for deletion in {countdown} seconds.
                </AlertDescription>
              </Alert>
              
              <Progress value={(5 - countdown) * 20} className="h-2" />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCountdownActive(false)} 
                  disabled={isDeleting || countdown === 0}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || countdown > 0}
                >
                  {isDeleting ? "Processing..." : "Confirm Deletion"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteAccountDialog;