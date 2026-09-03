import crypto from "crypto";
import Razorpay from "razorpay";
import MealPrice_Timings from "../models/mealPrice_Timings.models.js";
import Payment from "../models/payments.models.js";
import MealUsageService from "./mealUsage.service.js";

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async calculatePayment(data) {
    const { mealType, numberOfMeals } = data;

    if (!mealType || !numberOfMeals) {
      throw new Error("MealType and numberOfMeals are required");
    }

    let totalAmount = 0;
    const prices = await MealPrice_Timings.find({ mealType });

    for (const item of prices) {
      totalAmount += item.mealPrice * Number(numberOfMeals);
    }

    return totalAmount;
  }

  async createPayment(data) {
    const { userId, mealType, numberOfMeals } = data;

    const totalAmount = await this.calculatePayment({ mealType, numberOfMeals });

    const payment = new Payment({
      userId,
      startDate: Date.now(),
      endDate: Date.now() + Number(numberOfMeals)* 24 * 60 * 60 * 1000,
      mealType,
      numberOfMeals,
      totalAmount,
      status: "pending"
    });

    return await payment.save();
  }

  async createOrder(payment) {
    if (!payment) {
      throw new Error("Payment is required");
    }

    const options = {
      amount: Number(payment.totalAmount) * 100,
      currency: "INR",
      receipt: payment._id.toString()
    };

    const order = await this.razorpay.orders.create(options);

    payment.razorpayOrderId = order.id;
    await payment.save();

    return order;
  }

  async verifyRazorpayPayment(
  {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  },
  paymentId
) {
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new Error("Missing Razorpay verification data");
  }

  // Find your payment
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Prevent duplicate verification
  if (payment.status === "paid") {
    throw new Error("Payment has already been verified");
  }

  //  Verify Razorpay order belongs to this payment
  if (payment.razorpayOrderId !== razorpay_order_id) {
    throw new Error("Razorpay order does not match payment");
  }

  // Generate expected signature
  const generatedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(
      `${payment.razorpayOrderId}|${razorpay_payment_id}`
    )
    .digest("hex");

  const expected = Buffer.from(
    generatedSignature,
    "hex"
  );

  const received = Buffer.from(
    razorpay_signature,
    "hex"
  );

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    throw new Error(
      "Invalid Razorpay payment signature"
    );
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = "paid";
  payment.paidAt = new Date();

  await payment.save();

  await MealUsageService.generateMealUsages(
    payment
  );

  return payment;
}
  async getPaymentHistory(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return await Payment.find({ userId })
      .select(
        "mealType startDate endDate numberOfMeals totalAmount status paidAt createdAt"
      )
      .sort({ createdAt: -1 });
  }
}

export default new PaymentService();