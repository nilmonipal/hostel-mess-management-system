import MealUsageService from "../services/mealUsage.service.js";
import Payment from "../models/payments.models.js";
import MealPrice_Timings from "../models/mealPrice_Timings.models.js";
import QRService from "../services/qr.service.js";

const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

export const generateQr = async (req, res) => {
    try {
        const userId = req.user?._id || req.UserId;
        const mealType = req.body?.mealType || req.query.mealType;
        const mealDate = req.body?.mealDate || req.query.mealDate || new Date();

        if (!userId || !mealType) {
            return res.status(400).json({
                success: false,
                message: "Meal type is required",
            });
        }

        const timing = await MealPrice_Timings.findOne({ mealType });
        if (!timing) {
            return res.status(404).json({
                success: false,
                message: "Meal timing is not configured",
            });
        }

        const currentTime = new Date();
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const generationMinutes = toMinutes(timing.qrGenerationTime);
        const endMinutes = toMinutes(timing.endTime);
        const isOvernight = generationMinutes > endMinutes;
        const isAllowed = isOvernight
            ? currentMinutes >= generationMinutes || currentMinutes <= endMinutes
            : currentMinutes >= generationMinutes && currentMinutes <= endMinutes;

        if (!isAllowed) {
            return res.status(409).json({
                success: false,
                message: `QR generation is allowed between ${timing.qrGenerationTime} and ${timing.endTime}`,
            });
        }

        const paidPayments = await Payment.find({ userId, status: "paid" });
        for (const payment of paidPayments) {
            await MealUsageService.generateMealUsages(payment);
        }

        const result = await QRService.generateQR({ userId, mealType, mealDate });

        return res.status(201).json({
            success: true,
            message: "QR generated successfully",
            qrData: result.qrData,
            qr: result.qr,
            qrImage: result.qrImage,
        });
    } catch (error) {
        const statusCode = error.message.includes("no eligible meal") ? 409 : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export default { generateQr };