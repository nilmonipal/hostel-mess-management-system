import mongoose, { Schema } from "mongoose";

const mealExtensionSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		paymentId: {
			type: Schema.Types.ObjectId,
			ref: "Payment",
			required: true,
		},

		fromDate: {
			type: Date,
			required: true,
		},

		toDate: {
			type: Date,
			required: true,
		},

		numberOfDays: {
			type: Number,
			required: true,
			min: 1,
		},

		reason: {
			type: String,
			required: true,
			trim: true,
		},

		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
			index: true,
		},

		approvedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},

		approvedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

const MealExtension = mongoose.model("MealExtension", mealExtensionSchema);

export default MealExtension;