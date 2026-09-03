import {generateQr} from "../controllers/qr.controller.js"
import { authenticateUser } from "../middlewares/auth.middlewares.js";


export default(app) => {
    app.post('/api/v1/GenerateQr',[authenticateUser],generateQr)
}