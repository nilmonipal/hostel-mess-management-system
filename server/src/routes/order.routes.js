import {
  createOrderController,
  getPaymentHistoryController,
  verifyPaymentController,
} from "../controllers/payment.controllers.js";
import { authenticateUser } from "../middlewares/auth.middlewares.js";


export default(app) => {
    app.post('/api/v1/createOrder', authenticateUser, createOrderController);
    app.post('/api/v1/verifyPayment', authenticateUser, verifyPaymentController);
    app.get('/api/v1/payments/history', authenticateUser, getPaymentHistoryController);
}