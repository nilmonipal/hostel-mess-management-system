import {
  approveMealExtensionController,
  getAllMealExtensionsController,
  getUserMealExtensionsController,
  rejectMealExtensionController,
  requestMealExtensionController,
} from "../controllers/mealExtension.controller.js";
import { authenticateUser, isAdmin } from "../middlewares/auth.middlewares.js";

export default (app) => {
  app.get(
    "/api/meal-extensions",
    [authenticateUser, isAdmin],
    getAllMealExtensionsController
  );
  app.get(
    "/api/meal-extensions/mine",
    authenticateUser,
    getUserMealExtensionsController
  );
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
  app.put(
    "/api/meal-extensions/:extensionId/reject",
    [authenticateUser, isAdmin],
    rejectMealExtensionController
  );
};