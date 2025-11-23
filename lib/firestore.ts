import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './Firebase'; // Import db directly, not the app

// Create a booking
export async function createBooking(bookingData: any) {
  try {
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { id: docRef.id, ...bookingData };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

// Get user's bookings
export async function getUserBookings(userId: string) {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const bookings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
}

// Cancel a booking
export async function cancelBooking(bookingId: string) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error canceling booking:", error);
    throw error;
  }
}