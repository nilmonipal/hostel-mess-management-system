import {
	getMealHistoryController,
	getMealUsageByIdController,
	getTodayMealUsageController,
} from "../controllers/mealUsage.controller.js";
import { authenticateUser } from "../middlewares/auth.middlewares.js";

export default (app) => {
	app.get("/api/meal-usage/today", authenticateUser, getTodayMealUsageController);
	app.get("/api/meal-usage/history", authenticateUser, getMealHistoryController);
	app.get("/api/meal-usage/:mealUsageId", authenticateUser, getMealUsageByIdController);
};
