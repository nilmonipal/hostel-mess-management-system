import { Schema } from "mongoose";


const smartCardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
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