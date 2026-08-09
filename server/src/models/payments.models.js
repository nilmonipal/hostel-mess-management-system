import mongoose,{Schema} from "mongoose";

const paymentSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    transactionId: {
    type: String,
    required: true,
    unique: true // Ensures no duplicate payments are processed
    },

    mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner','fullday'], // Restricts the value to one of these strings
    required: true
    },
    
    numberOfMeals: { type: Number, required: true ,default:0},

    totalAmount: { type: Decimal128, required: true },

    status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
    },
    
    paymentDate: { type: Date, default: Date.now }
},{
    timestamps:true
});


export const Payment = mongoose.model("Payment", paymentSchema);
