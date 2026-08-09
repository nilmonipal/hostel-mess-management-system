import mongoose from "mongoose";

const qrCodesSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    mealUsageId:{
        type:Schema.Types.ObjectId,
        ref:"Meal_Usage",
        required:true
    },
    currentMealType:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    Date:{
        type:date
    },
},{
    timestamps:true
})


export const qrCodes=mongoose.model("qrCodes",qrCodesSchema)