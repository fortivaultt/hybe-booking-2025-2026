import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

const OtpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsOtpSent(true);
        toast({
          title: 'Success',
          description: 'OTP sent to your email address.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send OTP.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'OTP verified successfully!',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to verify OTP.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Toaster />
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Email Verification</h1>
        {!isOtpSent ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSendOtp} className="w-full">
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              An OTP has been sent to <strong>{email}</strong>. Please enter it below.
            </p>
            <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full">
              Verify OTP
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpPage;
