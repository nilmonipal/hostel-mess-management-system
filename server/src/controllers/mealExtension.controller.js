import MealExtensionService from "../services/mealExtension.service.js";

export const requestMealExtensionController = async (req, res) => {
	try {
		const mealExtension = await MealExtensionService.requestExtension({
			userId: req.user._id,
			paymentId: req.body.paymentId,
			fromDate: req.body.fromDate,
			toDate: req.body.toDate,
			reason: req.body.reason,
		});

		return res.status(201).json({
			success: true,
			mealExtension,
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export const approveMealExtensionController = async (req, res) => {
	try {
		const mealExtension = await MealExtensionService.approveExtension(
			req.params.extensionId,
			req.user._id
		);

		return res.status(200).json({
			success: true,
			mealExtension,
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

export default {
	requestMealExtensionController,
	approveMealExtensionController,
};


