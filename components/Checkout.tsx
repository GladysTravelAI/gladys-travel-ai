"use client";

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plane, Hotel, Users, Calendar, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

interface TravelerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  email?: string;
  phone?: string;
}

interface TripDetails {
  destination: string;
  dates: string;
  flightDetails?: string;
  hotelDetails?: string;
  departureCity?: string;
  returnCity?: string;
  checkIn?: string;
  checkOut?: string;
}

interface BookingDetails {
  flightCost: number;
  hotelCost: number;
  serviceFee: number;
  totalAmount: number;
}

interface CheckoutPageProps {
  tripDetails: TripDetails;
  bookingDetails: BookingDetails;
  onSuccess?: (orderId: string) => void;
}

export default function CheckoutPage({ tripDetails, bookingDetails, onSuccess }: CheckoutPageProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  
  // User Information
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'United States'
  });

  // Travelers Information
  const [travelers, setTravelers] = useState<TravelerInfo[]>([
    {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      email: '',
      phone: ''
    }
  ]);

  const functions = getFunctions();

  // Add traveler
  const addTraveler = () => {
    setTravelers([...travelers, {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      email: '',
      phone: ''
    }]);
  };

  // Remove traveler
  const removeTraveler = (index: number) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  };

  // Update traveler info
  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    const updated = [...travelers];
    updated[index][field] = value;
    setTravelers(updated);
  };

  // Validate user info
  const validateUserInfo = () => {
    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  // Validate travelers
  const validateTravelers = () => {
    for (let i = 0; i < travelers.length; i++) {
      const traveler = travelers[i];
      if (!traveler.firstName || !traveler.lastName || !traveler.dateOfBirth) {
        setError(`Please complete information for Traveler ${i + 1}`);
        return false;
      }
    }
    setError('');
    return true;
  };

  // Create PayPal order
  const createOrder = async () => {
    try {
      setLoading(true);
      const createPayPalOrder = httpsCallable(functions, 'createPayPalOrder');
      
      const result = await createPayPalOrder({
        userInfo,
        travelers,
        tripDetails,
        bookingDetails,
        returnUrl: `${window.location.origin}/booking/success`,
        cancelUrl: `${window.location.origin}/booking/cancel`
      });

      const data = result.data as any;
      
      if (data.success && data.orderId) {
        setOrderId(data.orderId);
        return data.orderId;
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err: any) {
      console.error('Create order error:', err);
      setError(err.message || 'Failed to create order. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Capture PayPal payment
  const capturePayment = async (orderId: string) => {
    try {
      setLoading(true);
      const capturePayPalPayment = httpsCallable(functions, 'capturePayPalPayment');
      
      const result = await capturePayPalPayment({ orderId });
      const data = result.data as any;

      if (data.success) {
        // Payment successful!
        if (onSuccess) {
          onSuccess(orderId);
        } else {
          router.push(`/booking/success?orderId=${orderId}`);
        }
      } else {
        throw new Error('Payment capture failed');
      }
    } catch (err: any) {
      console.error('Capture payment error:', err);
      setError(err.message || 'Payment failed. Please contact support.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Just a few more steps to your amazing trip!</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle size={20} /> : s}
                </div>
                {s < 4 && <div className={`w-16 h-1 ${s < step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: User Information */}
            {step === 1 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Users className="text-purple-600" />
                  Your Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <Input
                      value={userInfo.fullName}
                      onChange={(e) => setUserInfo({...userInfo, fullName: e.target.value})}
                      placeholder="John Doe"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email Address *</label>
                      <Input
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                        placeholder="john@example.com"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                      <Input
                        type="tel"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Country *</label>
                    <Input
                      value={userInfo.country}
                      onChange={(e) => setUserInfo({...userInfo, country: e.target.value})}
                      className="h-12"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (validateUserInfo()) setStep(2);
                  }}
                  className="w-full mt-6 h-12 bg-purple-600 hover:bg-purple-700 text-lg font-semibold"
                >
                  Continue to Traveler Information
                </Button>
              </Card>
            )}

            {/* Step 2: Traveler Information */}
            {step === 2 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Users className="text-purple-600" />
                  Traveler Information
                </h2>

                {travelers.map((traveler, index) => (
                  <div key={index} className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Traveler {index + 1}</h3>
                      {travelers.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => removeTraveler(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">First Name *</label>
                        <Input
                          value={traveler.firstName}
                          onChange={(e) => updateTraveler(index, 'firstName', e.target.value)}
                          placeholder="John"
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Last Name *</label>
                        <Input
                          value={traveler.lastName}
                          onChange={(e) => updateTraveler(index, 'lastName', e.target.value)}
                          placeholder="Doe"
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Date of Birth *</label>
                        <Input
                          type="date"
                          value={traveler.dateOfBirth}
                          onChange={(e) => updateTraveler(index, 'dateOfBirth', e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Passport Number</label>
                        <Input
                          value={traveler.passportNumber}
                          onChange={(e) => updateTraveler(index, 'passportNumber', e.target.value)}
                          placeholder="Optional"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addTraveler}
                  variant="outline"
                  className="w-full mb-4 h-12 border-2 border-purple-300 hover:bg-purple-50"
                >
                  + Add Another Traveler
                </Button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (validateTravelers()) setStep(3);
                    }}
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Review
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Review Trip Details */}
            {step === 3 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle className="text-purple-600" />
                  Review Your Trip
                </h2>

                <div className="space-y-6">
                  {/* Trip Summary */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Calendar className="text-purple-600" size={20} />
                      Trip Details
                    </h3>
                    <p className="text-sm"><strong>Destination:</strong> {tripDetails.destination}</p>
                    <p className="text-sm"><strong>Dates:</strong> {tripDetails.dates}</p>
                  </div>

                  {/* User Info */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold mb-3">Contact Information</h3>
                    <p className="text-sm"><strong>Name:</strong> {userInfo.fullName}</p>
                    <p className="text-sm"><strong>Email:</strong> {userInfo.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {userInfo.phone}</p>
                  </div>

                  {/* Travelers */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-bold mb-3">Travelers ({travelers.length})</h3>
                    {travelers.map((t, i) => (
                      <p key={i} className="text-sm">
                        {i + 1}. {t.firstName} {t.lastName} - {t.dateOfBirth}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="text-purple-600" />
                  Payment
                </h2>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                    <p className="text-gray-600">Processing your payment...</p>
                  </div>
                ) : (
                  <PayPalScriptProvider options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                    currency: "USD"
                  }}>
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "pay"
                      }}
                      createOrder={createOrder}
                      onApprove={async (data) => {
                        await capturePayment(data.orderID);
                      }}
                      onError={(err) => {
                        console.error('PayPal error:', err);
                        setError('Payment failed. Please try again.');
                      }}
                    />
                  </PayPalScriptProvider>
                )}

                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="w-full mt-4 h-12"
                  disabled={loading}
                >
                  Back to Review
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                {bookingDetails.flightCost > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Plane className="text-blue-600 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="font-semibold">Flight</p>
                      <p className="text-sm text-gray-600">{tripDetails.flightDetails || 'Round trip flight'}</p>
                      <p className="font-bold text-lg mt-1">${bookingDetails.flightCost.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {bookingDetails.hotelCost > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Hotel className="text-purple-600 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="font-semibold">Hotel</p>
                      <p className="text-sm text-gray-600">{tripDetails.hotelDetails || 'Hotel accommodation'}</p>
                      <p className="font-bold text-lg mt-1">${bookingDetails.hotelCost.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      ${(bookingDetails.flightCost + bookingDetails.hotelCost).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-semibold">${bookingDetails.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-purple-600 pt-4 border-t">
                    <span>Total</span>
                    <span>${bookingDetails.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 flex items-start gap-2">
                    <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                    <span>
                      Secure payment powered by PayPal. Your information is protected with industry-standard encryption.
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}