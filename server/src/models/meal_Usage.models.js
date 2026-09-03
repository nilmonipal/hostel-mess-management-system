import mongoose, { Schema } from "mongoose";

const mealUsageSchema = new Schema(
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

    mealUsageId: {
      type: String,
      required: true,
      unique: true,
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

    entitled: {
      type: Boolean,
      default: true,
    },

    used: {
      type: Boolean,
      default: false,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    verificationMethod: {
      type: String,
      enum: ["qr", "rfid"],
      default: null,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One student can have only one entitlement
// for a particular meal on a particular date.
mealUsageSchema.index(
  {
    userId: 1,
    mealDate: 1,
    mealType: 1,
  },
  {
    unique: true,
  }
);

const Meal_Usage = mongoose.model("Meal_Usage", mealUsageSchema);

export default Meal_Usage;