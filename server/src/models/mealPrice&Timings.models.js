import mongoose,{Schema} from "mongoose";

const mealUsageSchema = new Schema({

    mealId:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner','fullday'], // Restricts the value to one of these strings
        required: true
    },
    mealPrice: { type: Number, required: true },

    startTime: { type: Date, required: true },

    endTime: { type: Date, required: true },

    qrGenerationTime: { type: Date, required: true },
});


export const MealPrice_Timings = mongoose.model("MealPrice_Timings",mealUsageSchema)