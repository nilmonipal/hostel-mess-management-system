const mongoose = require('mongoose');

//QRVerification
// {
//     _id,
//     qrId,
//     mealUsageId,
//     studentId,
//     verifiedBy,      // Admin
//     status,          // accepted / rejected
//     rejectionReason,
//     scannedAt,
//     verifiedAt
// }

const qrVerificationSchema = new mongoose.Schema({
    qrId: {
        type: String,
        required: true,
        unique: true
    },
    mealUsageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPrice_Timings',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
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
    scannedAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});