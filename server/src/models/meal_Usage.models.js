import mongoose,{Schema} from "mongoose";

const mealUsageSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    paymentId:{
        type:Schema.Types.ObjectId,
        ref:"Payment",
        required:true,
    },
    mealUsageId:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    mealUsageType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner','fullday'], // Restricts the value to one of these strings
        required: true
    },
    mealUsageDate: { type: Date, default: Date.now }
},{
    timestamps:true
});

export const Meal_Usage =mongoose.model("Meal_Usage",mealUsageSchema)