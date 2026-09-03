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
      payment,
      order
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
      paymentId
    );

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export default{
  createOrderController,
  verifyPaymentController
}