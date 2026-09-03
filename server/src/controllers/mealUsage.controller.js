import MealUsageService from "../services/mealUsage.service.js";
import Payment from "../models/payments.models.js";

export const getTodayMealUsageController = async (req, res) => {
	try {
		
		// const payments = await Payment.find({
		// 	userId: req.user._id,
		// 	status: "paid",
		// });

		// for (const payment of payments) {
		// 	await MealUsageService.generateMealUsages(payment);
		// }

		const mealUsage = await MealUsageService.getTodayMealUsage(req.user._id);

		return res.status(200).json({
			success: true,
			mealUsage,
		});
		
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export const getMealHistoryController = async (req, res) => {
	try {
		const mealUsage = await MealUsageService.getMealHistory(req.user._id, req.query);

		return res.status(200).json({
			success: true,
			mealUsage,
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export const getMealUsageByIdController = async (req, res) => {
	try {
		const mealUsage = await MealUsageService.getMealUsageById(req.params.mealUsageId);

		if (!mealUsage) {
			return res.status(404).json({
				success: false,
				message: "Meal usage not found",
			});
		}

		const isAdmin = req.user.role === "admin";
		if (!isAdmin && mealUsage.userId.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		return res.status(200).json({
			success: true,
			mealUsage,
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export default {
	getTodayMealUsageController,
	getMealHistoryController,
	getMealUsageByIdController,
};
