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

    const validMealTypes = ["breakfast", "lunch", "dinner", "fullday"];
    const days = Number(numberOfMeals);
    if (!validMealTypes.includes(mealType) || !Number.isInteger(days) || days < 1) {
      throw new Error("A valid meal type and positive whole number of days are required");
    }

    let prices;
    if (mealType === "fullday") {
      const fullDayPrices = await MealPrice_Timings.find({ mealType: "fullday" });
      prices = fullDayPrices.length
        ? fullDayPrices
        : await MealPrice_Timings.find({ mealType: { $in: ["breakfast", "lunch", "dinner"] } });
    } else {
      prices = await MealPrice_Timings.find({ mealType });
    }

    if (!prices.length) {
      throw new Error("Meal pricing is not configured for the selected plan");
    }

    return prices.reduce((total, item) => total + Number(item.mealPrice) * days, 0);
  }

  async createPayment(data) {
    const { userId, mealType, numberOfMeals } = data;

    const totalAmount = await this.calculatePayment({ mealType, numberOfMeals });

    const startDate = new Date();
    const payment = new Payment({
      userId,
      startDate,
      endDate: new Date(startDate.getTime() + (Number(numberOfMeals) - 1) * 24 * 60 * 60 * 1000),
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

    const amountInPaise = Math.round(Number(payment.totalAmount) * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 1) {
      throw new Error("Payment amount must be a positive amount in INR");
    }

    const options = {
      amount: amountInPaise,
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
  paymentId,
  userId
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

  if (!userId || payment.userId.toString() !== userId.toString()) {
    throw new Error("Access denied");
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

  if (payment.status === "paid") {
    if (payment.razorpayPaymentId !== razorpay_payment_id) {
      throw new Error("Payment has already been verified with a different payment");
    }
    return payment;
  }

  await MealUsageService.generateMealUsages(payment);

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = "paid";
  payment.paidAt = new Date();

  return payment.save();
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