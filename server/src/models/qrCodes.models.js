import mongoose, { Schema } from "mongoose";

const mealQRSchema = new Schema(
  {
    qrId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mealUsageId: {
      type: Schema.Types.ObjectId,
      ref: "Meal_Usage",
      required: true,
      index: true,
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },

    mealDate: {
      type: Date,
      required: true,
      index: true,
    },

    generatedAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// MongoDB automatically removes expired QR documents.
mealQRSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const Meal_QR = mongoose.model("Meal_QR", mealQRSchema);

export default Meal_QR;