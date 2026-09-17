import {
  getTodayOverviews,
  getMealStatistics,
  getPaymentStatus,
  getRecentMealActivity,
  getDetailsofStudent,
} from "../controllers/adminDashboard.controller.js";
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";

export default (app) => {
  app.get("/api/v1/admin/dashboard/overview", [authenticateUser, isAdmin], getTodayOverviews);
  app.get("/api/v1/admin/dashboard/meal-statistics", [authenticateUser, isAdmin], getMealStatistics);
  app.get("/api/v1/admin/dashboard/payment-status", [authenticateUser, isAdmin], getPaymentStatus);
  app.get("/api/v1/admin/dashboard/recent-activity", [authenticateUser, isAdmin], getRecentMealActivity);
  app.get("/api/v1/admin/dashboard/search-student", [authenticateUser, isAdmin], getDetailsofStudent);
};