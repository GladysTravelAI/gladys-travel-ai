import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    const { travelerInfo, paymentInfo, cartItems, userId } = await req.json();

    const flightCost = cartItems
      .filter((item: any) => item.type === 'flight')
      .reduce((sum: number, item: any) => sum + item.price, 0);
    
    const hotelCost = cartItems
      .filter((item: any) => item.type === 'hotel')
      .reduce((sum: number, item: any) => sum + item.price, 0);
    
    const serviceFee = (flightCost + hotelCost) * 0.05;
    const totalAmount = flightCost + hotelCost + serviceFee;

    const bookingNumber = `GLY${Date.now().toString().slice(-8)}`;

    const bookingData = {
      userId,
      bookingNumber,
      status: 'CONFIRMED',
      destination: cartItems[0]?.destination || '',
      origin: cartItems[0]?.origin || '',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      travelers: 1,
      flightCost,
      hotelCost,
      servicesFee: serviceFee,
      totalAmount,
      paymentStatus: 'COMPLETED',
      paymentMethod: 'Credit Card',
      transactionId: `TXN${Date.now()}`,
      travelerInfo,
      flights: cartItems
        .filter((item: any) => item.type === 'flight')
        .map((item: any) => ({
          ...item,
          confirmationNumber: `FLT${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          eTicketNumber: `E${Math.random().toString().slice(2, 15)}`,
        })),
      hotels: cartItems
        .filter((item: any) => item.type === 'hotel')
        .map((item: any) => ({
          ...item,
          confirmationNumber: `HTL${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        }))
    };

    const booking = await createBooking(bookingData);

    console.log('✅ Booking created in Firestore:', booking);
    console.log('📧 Email would be sent to:', travelerInfo.email);

    return NextResponse.json({ 
      success: true, 
      booking: {
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount
      }
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}