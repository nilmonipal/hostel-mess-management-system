import {createOrderController,verifyPaymentController} from "../controllers/payment.controllers.js";
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";


export default(app) => {
    app.post('/api/v1/createOrder',[authenticateUser],createOrderController)
}