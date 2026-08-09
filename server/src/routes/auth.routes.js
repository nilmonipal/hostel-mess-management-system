
const { registerUser, loginUser } = require('../controllers/auth.controllers');


module.exports = (app) => {
    app.post('/api/v1/auth/register', registerUser);
    app.post('/api/v1/auth/login', loginUser);
    }