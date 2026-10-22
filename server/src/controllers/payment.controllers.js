import PaymentService from "../services/payment.service.js";

export const createOrderController = async (req, res) => {
  try {
    const { mealType, numberOfMeals } = req.body;
    const userId = req.user._id;

    const payment = await PaymentService.createPayment({
      userId,
      mealType,
      numberOfMeals
    });

    const order = await PaymentService.createOrder(payment);

    return res.status(200).json({
      success: true,
      payment: {
        _id: payment._id,
        mealType: payment.mealType,
        numberOfMeals: payment.numberOfMeals,
        totalAmount: payment.totalAmount,
        status: payment.status,
      },
      order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export const verifyPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId
    } = req.body;

    const payment = await PaymentService.verifyRazorpayPayment(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      paymentId,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      payment: {
        _id: payment._id,
        mealType: payment.mealType,
        numberOfMeals: payment.numberOfMeals,
        totalAmount: payment.totalAmount,
        status: payment.status,
        paidAt: payment.paidAt,
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getPaymentHistoryController = async (req, res) => {
  try {
    const payments = await PaymentService.getPaymentHistory(req.user._id);
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export default{
  createOrderController,
  verifyPaymentController,
  getPaymentHistoryController
}