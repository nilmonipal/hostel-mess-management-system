import {QrVerify,acceptQR,declineQR} from "../controllers/qrVerification.controller.js"
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";

export default (app) =>{
    app.post('/api/v1/qr/verify',[authenticateUser,isAdmin],QrVerify)
    app.post('/api/v1/qr/acceptQR',[authenticateUser,isAdmin],acceptQR)
    app.post('/api/v1/qr/declineQR',[authenticateUser,isAdmin],declineQR)
}