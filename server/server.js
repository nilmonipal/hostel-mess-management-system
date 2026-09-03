import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
const { connect, connection } = mongoose;
import { PORT as port } from './src/configs/auth.configs.js';
import { db_url, db_name } from './src/configs/db.configs.js';
import user_model from './src/models/user.models.js';
import { hashSync } from 'bcrypt';
import authRoutes from './src/routes/auth.routes.js';
import mealPriceAndTimeRoutes from './src/routes/mealPrice.routes.js';
import orderRoutes from "./src/routes/order.routes.js"
import mealUsageRoutes from "./src/routes/mealUsage.routes.js";
import qrRoutes from './src/routes/qr.routes.js';
import qrVerifyRoutes from "./src/routes/qrVerification.routes.js"
const app = express();

// Middleware
app.use(express.json());

connect(`${db_url}/${db_name}`);
const db = connection;

db.on('error', () => {
  console.log('Error while connecting to the database');
});

db.once('open', () => {
  console.log('Successfully connected to the database');
  init();
});

async function init() {
  try {
    let user = await user_model.findOne({ role: 'admin' });
    if (user) {
      console.log('Admin is already present.');
      return;
    }
  } catch (error) {
    console.log('Error while checking for Admin :', error);
  }

  try {
    await user_model.create({
      username: 'Nilmoni',
      userId: 'admin1',
      password: hashSync('Admin@123', 8),
      email: 'nilmoni@gmail.com',
      phone: '1234567890',
      role: 'admin',
    });
    console.log('Admin is created');
  } catch (error) {
    console.log('Error while creating a Admin :', error);
  }
}

// stitching the routes
authRoutes(app);
mealPriceAndTimeRoutes(app);
orderRoutes(app);
mealUsageRoutes(app);
qrRoutes(app);
qrVerifyRoutes(app);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

