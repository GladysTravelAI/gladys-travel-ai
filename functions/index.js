const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const PAYPAL_API = process.env.PAYPAL_MODE === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Get PayPal Access Token
async function getPayPalAccessToken() {
  const PAYPAL_CLIENT_ID = functions.config().paypal.client_id;
  const PAYPAL_SECRET = functions.config().paypal.secret;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

  try {
    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response.data.access_token;
  } catch (error) {
    console.error("PayPal Auth Error:", error.response?.data || error.message);
    throw new functions.https.HttpsError("internal", "Failed to authenticate with PayPal");
  }
}

// Create PayPal Order
exports.createPayPalOrder = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const {bookingDetails, userInfo, travelers, tripDetails} = data;

    if (!bookingDetails?.totalAmount || !userInfo?.email) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required booking information");
    }

    const flightCost = bookingDetails.flightCost || 0;
    const hotelCost = bookingDetails.hotelCost || 0;
    const serviceFee = bookingDetails.serviceFee || 0;
    const totalAmount = (flightCost + hotelCost + serviceFee).toFixed(2);

    const accessToken = await getPayPalAccessToken();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `GLADYS_${Date.now()}`,
          description: `${tripDetails.destination} Trip - ${tripDetails.dates}`,
          amount: {
            currency_code: "USD",
            value: totalAmount,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: totalAmount,
              },
            },
          },
          items: [
            ...(flightCost > 0 ? [{
              name: `Flight to ${tripDetails.destination}`,
              description: `${tripDetails.flightDetails || "Round trip flight"}`,
              unit_amount: {
                currency_code: "USD",
                value: flightCost.toFixed(2),
              },
              quantity: "1",
            }] : []),
            ...(hotelCost > 0 ? [{
              name: `Hotel in ${tripDetails.destination}`,
              description: `${tripDetails.hotelDetails || "Hotel accommodation"}`,
              unit_amount: {
                currency_code: "USD",
                value: hotelCost.toFixed(2),
              },
              quantity: "1",
            }] : []),
            ...(serviceFee > 0 ? [{
              name: "GladysTravelAI Service Fee",
              description: "Booking and support service",
              unit_amount: {
                currency_code: "USD",
                value: serviceFee.toFixed(2),
              },
              quantity: "1",
            }] : []),
          ],
        },
      ],
      application_context: {
        brand_name: "GladysTravelAI",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${data.returnUrl || "https://your-domain.com"}/booking/success`,
        cancel_url: `${data.cancelUrl || "https://your-domain.com"}/booking/cancel`,
      },
    };

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      orderPayload,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const orderId = response.data.id;

    const bookingRef = admin.firestore().collection("bookings").doc(orderId);
    await bookingRef.set({
      orderId,
      userId: context.auth.uid,
      userInfo,
      travelers,
      tripDetails,
      bookingDetails: {
        flightCost,
        hotelCost,
        serviceFee,
        totalAmount: parseFloat(totalAmount),
      },
      status: "pending",
      paymentStatus: "awaiting_payment",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId: orderId,
      bookingId: orderId,
    };
  } catch (error) {
    console.error("Create Order Error:", error.response?.data || error.message);
    throw new functions.https.HttpsError("internal", error.message || "Failed to create PayPal order");
  }
});

// Capture PayPal Payment
exports.capturePayPalPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const {orderId} = data;

    if (!orderId) {
      throw new functions.https.HttpsError("invalid-argument", "Order ID is required");
    }

    const accessToken = await getPayPalAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = response.data;

    const bookingRef = admin.firestore().collection("bookings").doc(orderId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Booking not found");
    }

    if (bookingDoc.data()?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized access to booking");
    }

    await bookingRef.update({
      status: "confirmed",
      paymentStatus: "paid",
      paymentDetails: {
        captureId: captureData.purchase_units[0].payments.captures[0].id,
        payerEmail: captureData.payer.email_address,
        payerName: captureData.payer.name.given_name + " " + captureData.payer.name.surname,
        capturedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      orderId,
      captureId: captureData.purchase_units[0].payments.captures[0].id,
      status: "completed",
    };
  } catch (error) {
    console.error("Capture Payment Error:", error.response?.data || error.message);

    if (data.orderId) {
      await admin.firestore().collection("bookings").doc(data.orderId).update({
        status: "failed",
        paymentStatus: "failed",
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    throw new functions.https.HttpsError("internal", error.message || "Failed to capture payment");
  }
});

// Get Booking Details
exports.getBooking = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const {bookingId} = data;

    if (!bookingId) {
      throw new functions.https.HttpsError("invalid-argument", "Booking ID is required");
    }

    const bookingRef = admin.firestore().collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Booking not found");
    }

    const bookingData = bookingDoc.data();

    if (bookingData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized access to booking");
    }

    return {
      success: true,
      booking: {
        id: bookingDoc.id,
        ...bookingData,
      },
    };
  } catch (error) {
    console.error("Get Booking Error:", error.message);
    throw new functions.https.HttpsError("internal", error.message || "Failed to get booking");
  }
});

// Get User's Bookings
exports.getUserBookings = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const bookingsSnapshot = await admin.firestore()
        .collection("bookings")
        .where("userId", "==", context.auth.uid)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      bookings,
    };
  } catch (error) {
    console.error("Get User Bookings Error:", error.message);
    throw new functions.https.HttpsError("internal", "Failed to get bookings");
  }
});