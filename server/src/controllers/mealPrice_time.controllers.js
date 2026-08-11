import mealPriceService from "../services/mealPrice_time.services.js";

// Add Meal Price and Time
export async function addMealPriceAndTime(req, res) {
    try {
        const result = await mealPriceService.addMealPriceAndTime(req.body);
        return res.status(201).json({ message: "Created", result });
    } catch (err) {
        return res.status(500).json({ message: "Error creating", error: err.message });
    }
}

// get all meal price and time details
export async function getMealPriceAndTime(req, res) {
    try {
        const list = await mealPriceService.getMealPriceAndTime();
        return res.status(200).json({ data: list });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching", error: err.message });
    }
}

// update meal price and time details
export async function updateMealPriceAndTime(req, res) {
    try {
        const updated = await mealPriceService.updateMealPriceAndTime(req.body);
        return res.status(200).json({ message: "Updated", updated });
    } catch (err) {
        return res.status(500).json({ message: "Error updating", error: err.message });
    }
}

export default {
    addMealPriceAndTime,
    getMealPriceAndTime,
    updateMealPriceAndTime
};