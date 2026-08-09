const mongoose = require("mongoose");


const smartCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    lastUsedDate: {
        type: Date,
        default: null
    }
});