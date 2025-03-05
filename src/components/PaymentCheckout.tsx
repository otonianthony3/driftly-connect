import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPaymentGateway, PaymentMethod, SupportedGateway } from "@/services/PaymentGatewayService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PaymentCheckoutProps {
  amount: number;
  currency?: string;
  description: string;
  contributionId?: string;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: Error) => void;
}

const PaymentCheckout = ({
  amount,
  currency = "USD",
  description,
  contributionId,
  onPaymentSuccess,
  onPaymentError
}: PaymentCheckoutProps) => {
  const [open, setOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<string>("card");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [addingNewMethod, setAddingNewMethod] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<SupportedGateway>("paystack");
  
  // New card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    saveCard: true
  });

  // Bank account details
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    routingNumber: "",
    saveAccount: true
  });

  // Mobile money details
  const [mobileMoneyDetails, setMobileMoneyDetails] = useState({
    phoneNumber: "",
    provider: "mtn",
    saveMobileNumber: true
  });

  const queryClient = useQueryClient();

  // Fetch saved payment methods
  const { data: paymentMethods, isLoading: loadingPaymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const gateway = await getPaymentGateway();
      return gateway.getUserPaymentMethods();
    }
  });

  // Mutation for processing payment
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      setProcessingPayment(true);
      setPaymentError(null);
      
      try {
        const gateway = await getPaymentGateway();
        
        // Initiate payment
        const response = await gateway.initiatePayment({
          amount,
          currency,
          description,
          payment_method_id: selectedPaymentMethod || undefined,
          contribution_id: contributionId,
          metadata: {
            payment_type: paymentTab
          }
        });
        
        // For demo purposes, we'll simulate a delay and then verify the payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify payment status
        const verificationResult = await gateway.verifyPayment(response.id);
        
        if (verificationResult.status === 'succeeded') {
          setPaymentSuccess(true);
          if (onPaymentSuccess) onPaymentSuccess();
          return verificationResult;
        } else {
          throw new Error(verificationResult.error_message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        if (error instanceof Error) {
          setPaymentError(error.message);
          if (onPaymentError) onPaymentError(error);
        } else {
          const genericError = new Error('An unknown error occurred during payment processing');
          setPaymentError(genericError.message);
          if (onPaymentError) onPaymentError(genericError);
        }
        throw error;
      } finally {
        setProcessingPayment(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success("Payment processed successfully!");
    },
    onError: () => {
      toast.error("Payment failed. Please try again or use a different payment method.");
    }
  });

  // Add new payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: async () => {
      const gateway = await getPaymentGateway();
      
      let methodData;
      
      if (paymentTab === 'card') {
        // Extract expiry month and year
        const [expiryMonth, expiryYear] = cardDetails.expiryDate.split('/');
        
        methodData = {
          type: 'card' as const,
          last4: cardDetails.cardNumber.slice(-4),
          expiry: `${expiryMonth?.trim() || ''}/${expiryYear?.trim() || ''}`,
          brand: getCardBrand(cardDetails.cardNumber),
          name: cardDetails.cardholderName
        };
      } else if (paymentTab === 'bank') {
        methodData = {
          type: 'bank_account' as const,
          last4: bankDetails.accountNumber.slice(-4),
          name: `${bankDetails.bankName} - ${bankDetails.accountName}`
        };
      } else if (paymentTab === 'mobile_money') {
        methodData = {
          type: 'mobile_money' as const,
          last4: mobileMoneyDetails.phoneNumber.slice(-4),
          name: `${mobileMoneyDetails.provider.toUpperCase()} - ${mobileMoneyDetails.phoneNumber}`
        };
      } else {
        throw new Error('Invalid payment method type');
      }
      
      return await gateway.addPaymentMethod(methodData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setSelectedPaymentMethod(data.id);
      setAddingNewMethod(false);
      toast.success("Payment method added successfully!");
    },
    onError: (error) => {
      console.error('Error adding payment method:', error);
      toast.error("Failed to add payment method. Please try again.");
    }
  });

  // Helper function to identify card brand from number
  const getCardBrand = (cardNumber: string): string => {
    // Very simplified card brand detection
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'American Express';
    if (cardNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      setPaymentTab("card");
      setSelectedPaymentMethod("");
      setAddingNewMethod(false);
      setProcessingPayment(false);
      setPaymentSuccess(false);
      setPaymentError(null);
      
      // Reset form states
      setCardDetails({
        cardNumber: "",
        cardholderName: "",
        expiryDate: "",
        cvv: "",
        saveCard: true
      });
      
      setBankDetails({
        accountNumber: "",
        accountName: "",
        bankName: "",
        routingNumber: "",
        saveAccount: true
      });
      
      setMobileMoneyDetails({
        phoneNumber: "",
        provider: "mtn",
        saveMobileNumber: true
      });
    }
  }, [open]);

  const handleMakePayment = async () => {
    try {
      await processPaymentMutation.mutateAsync();
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error('Payment failed:', error);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      await addPaymentMethodMutation.mutateAsync();
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error('Failed to add payment method:', error);
    }
  };

  // Format currency for display
  const formatCurrency = (value: number, curr = "NGN") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Make Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-center text-muted-foreground mb-6">
              Your payment of {formatCurrency(amount)} has been processed successfully.
            </p>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : paymentError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
            <p className="text-center text-muted-foreground mb-2">
              There was an error processing your payment:
            </p>
            <p className="text-center font-medium text-red-600 mb-6">
              {paymentError}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button onClick={() => {
                setPaymentError(null);
                setProcessingPayment(false);
              }}>Try Again</Button>
            </div>
          </div>
        ) : processingPayment ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
            <p className="text-center text-muted-foreground">
              Please wait while we process your payment of {formatCurrency(amount)}.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Choose your preferred payment method to complete your {formatCurrency(amount)} payment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <Label htmlFor="gateway">Payment Gateway</Label>
                <Select
                  value={selectedGateway}
                  onValueChange={(value) => setSelectedGateway(value as SupportedGateway)}
                >
                  <SelectTrigger id="gateway" className="w-full mt-1">
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Tabs value={paymentTab} onValueChange={setPaymentTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="card">Card</TabsTrigger>
                  <TabsTrigger value="bank">Bank</TabsTrigger>
                  <TabsTrigger value="mobile_money">Mobile Money</TabsTrigger>
                </TabsList>

                <TabsContent value="card">
                  {!addingNewMethod && paymentMethods && paymentMethods.length > 0 && (
                    <div className="mb-4">
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-2"
                      >
                        {paymentMethods
                          .filter(method => method.type === 'card')
                          .map(card => (
                            <div key={card.id} className="flex items-center space-x-2 border p-3 rounded-md">
                              <RadioGroupItem value={card.id} id={card.id} />
                              <Label htmlFor={card.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between">
                                  <span>{card.brand} •••• {card.last4}</span>
                                  <span className="text-muted-foreground text-sm">
                                    {card.expiry}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          ))}
                      </RadioGroup>
                    </div>
                  )}

                  {addingNewMethod ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          placeholder="John Doe"
                          value={cardDetails.cardholderName}
                          onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveCard"
                          checked={cardDetails.saveCard}
                          onChange={(e) => setCardDetails({...cardDetails, saveCard: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="saveCard">Save card for future payments</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setAddingNewMethod(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPaymentMethod} disabled={addPaymentMethodMutation.isPending}>
                          {addPaymentMethodMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Card"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mb-4"
                      onClick={() => setAddingNewMethod(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add New Card
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="bank">
                  {!addingNewMethod && paymentMethods && paymentMethods.length > 0 && (
                    <div className="mb-4">
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-2"
                      >
                        {paymentMethods
                          .filter(method => method.type === 'bank_account')
                          .map(account => (
                            <div key={account.id} className="flex items-center space-x-2 border p-3 rounded-md">
                              <RadioGroupItem value={account.id} id={account.id} />
                              <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between">
                                  <span>{account.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    •••• {account.last4}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          ))}
                      </RadioGroup>
                    </div>
                  )}

                  {addingNewMethod ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Bank Name"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          value={bankDetails.accountName}
                          onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="0123456789"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          placeholder="123456789"
                          value={bankDetails.routingNumber}
                          onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveAccount"
                          checked={bankDetails.saveAccount}
                          onChange={(e) => setBankDetails({...bankDetails, saveAccount: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="saveAccount">Save account for future payments</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setAddingNewMethod(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPaymentMethod} disabled={addPaymentMethodMutation.isPending}>
                          {addPaymentMethodMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Account"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mb-4"
                      onClick={() => setAddingNewMethod(true)}
                    >
                      Add New Bank Account
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="mobile_money">
                  {!addingNewMethod && paymentMethods && paymentMethods.length > 0 && (
                    <div className="mb-4">
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-2"
                      >
                        {paymentMethods
                          .filter(method => method.type === 'mobile_money')
                          .map(account => (
                            <div key={account.id} className="flex items-center space-x-2 border p-3 rounded-md">
                              <RadioGroupItem value={account.id} id={account.id} />
                              <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between">
                                  <span>{account.name}</span>
                                  <span className="text-muted-foreground text-sm">
                                    •••• {account.last4}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          ))}
                      </RadioGroup>
                    </div>
                  )}

                  {addingNewMethod ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          placeholder="+233 XX XXX XXXX"
                          value={mobileMoneyDetails.phoneNumber}
                          onChange={(e) => setMobileMoneyDetails({...mobileMoneyDetails, phoneNumber: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <Select
                          value={mobileMoneyDetails.provider}
                          onValueChange={(value) => setMobileMoneyDetails({...mobileMoneyDetails, provider: value})}
                        >
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                            <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                            <SelectItem value="airtel">Airtel Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveMobileNumber"
                          checked={mobileMoneyDetails.saveMobileNumber}
                          onChange={(e) => setMobileMoneyDetails({...mobileMoneyDetails, saveMobileNumber: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="saveMobileNumber">Save for future payments</Label>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setAddingNewMethod(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPaymentMethod} disabled={addPaymentMethodMutation.isPending}>
                          {addPaymentMethodMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mb-4"
                      onClick={() => setAddingNewMethod(true)}
                    >
                      Add Mobile Money
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end pt-4 mt-4 border-t">
                <Button 
                  onClick={handleMakePayment} 
                  disabled={!selectedPaymentMethod || processingPayment}
                >
                  Pay {formatCurrency(amount)}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCheckout;
