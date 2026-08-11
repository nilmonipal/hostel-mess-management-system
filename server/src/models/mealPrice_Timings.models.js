import mongoose, { Schema } from "mongoose";

const mealUsageSchema = new Schema({
    mealId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'fullday'],
        required: true
    },
    mealPrice: {
        type: Number,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        match: /^[0-2]\d:[0-5]\d$/ // HH:MM
    },
    endTime: {
        type: String,
        required: true,
        match: /^[0-2]\d:[0-5]\d$/
    },
    qrGenerationTime: {
        type: String,
        required: true,
        match: /^[0-2]\d:[0-5]\d$/
    }
},{ timestamps: true ,versionKey: false });

 const MealPrice_Timings = mongoose.model("MealPrice_Timings", mealUsageSchema);

 export default MealPrice_Timings;