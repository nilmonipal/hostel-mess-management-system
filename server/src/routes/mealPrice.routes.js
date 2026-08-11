import { addMealPriceAndTime,getMealPriceAndTime, updateMealPriceAndTime } from "../controllers/mealPrice_time.controllers.js";
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";


export default (app) => {
    app.post("/api/mealPriceAndTime", [authenticateUser, isAdmin], addMealPriceAndTime);
    app.get("/api/mealPriceAndTime", [authenticateUser, isAdmin], getMealPriceAndTime);
    app.put("/api/mealPriceAndTime", [authenticateUser, isAdmin], updateMealPriceAndTime);
}