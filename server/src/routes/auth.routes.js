import { registerUser, loginUser } from '../controllers/auth.controllers.js';


export default (app) => {
    app.post('/api/v1/auth/register', registerUser);
    app.post('/api/v1/auth/login', loginUser);
    }