import Payment from "../models/payments.models.js";
import user_model from "../models/user.models.js";
import Meal_Usage from "../models/meal_Usage.models.js";
import qrVerification from "../models/qrVerification.models.js";
import AdminDashboardService from "../services/adminDashboard.service.js";

const getTodayOverviews = async (req, res) => {
    try {
        const result = await AdminDashboardService.getTodayOverviews(Payment, user_model, Meal_Usage);
        return res.status(200).json({
            message: "Today Overviews fetched successfully",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const getMealStatistics = async (req, res) => {
    try {
        const result = await AdminDashboardService.getMealStatistics(Meal_Usage);
        return res.status(200).json({
            message: "Your Meal Statistics are ready",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const result = await AdminDashboardService.getRecentPaymentStatus(Payment);

        return res.status(200).json({
            success: true,
            message: result.length ? "Payment status fetched" : "No payments today",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const getRecentMealActivity = async (req, res) => {
    try {
        const result = await AdminDashboardService.getRecentMealActivity(qrVerification);
        return res.status(200).json({
            success: true,
            message: result.length ? "Meal Activity Fetched" : "No Meal Activity today",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const getDetailsofStudent = async (req, res) => {
    try {
        const search = req.query.search || req.params.search || "";
        const result = await AdminDashboardService.searchStudent(search, Payment, user_model);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export {
    getTodayOverviews,
    getMealStatistics,
    getPaymentStatus,
    getRecentMealActivity,
    getDetailsofStudent,
};

export default {
    getTodayOverviews,
    getMealStatistics,
    getPaymentStatus,
    getRecentMealActivity,
    getDetailsofStudent,
};


