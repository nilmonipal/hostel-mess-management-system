import mongoose, { Schema } from 'mongoose';

//QRVerification
// qrId
// mealUsageId
// studentId
// verifiedBy
// status
// rejectionReason
// verifiedAt
// timestamps (createdAt, updatedAt)

const qrVerificationSchema = new Schema({
    qrId: {
        type: String,
        required: true,
        unique: true
    },
    mealUsageId: {
        type: Schema.Types.ObjectId,
        ref: 'Meal_Usage',
        required: true
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['accepted', 'rejected'],
        required: true
    },
    rejectionReason: {
        type: String,
        default: null
    },
    verifiedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const qrVerification = mongoose.model("qrVerification", qrVerificationSchema)

export default qrVerification;