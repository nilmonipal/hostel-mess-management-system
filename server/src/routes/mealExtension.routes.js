import {
  approveMealExtensionController,
  requestMealExtensionController,
} from "../controllers/mealExtension.controller.js";
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";

export default (app) => {
  app.post(
    "/api/meal-extensions",
    authenticateUser,
    requestMealExtensionController
  );
  app.put(
    "/api/meal-extensions/:extensionId/approve",
    [authenticateUser, isAdmin],
    approveMealExtensionController
  );
};