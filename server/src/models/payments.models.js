import mongoose,{Schema} from "mongoose";

const paymentSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    startDate: Date,
    endDate: Date,
    

    mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner','fullday'], // Restricts the value to one of these strings
    required: true
    },
    
    numberOfMeals: { type: Number, required: true ,default:0},

    totalAmount: { type: Number, required: true },

    status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'failed'],
    default: 'pending' 
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    
    paymentDate: { type: Date, default: Date.now }
},{
    timestamps:true
});


const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
