import Payment from "../models/payments.models.js";
import Meal_Usage from "../models/meal_Usage.models.js";
import MealExtension from "../models/mealExtension.models.js";

const mealTypes = ["breakfast", "lunch", "dinner"];

const normalizeDate = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const calculateNumberOfDays = (fromDate, toDate) => {
  const startDate = normalizeDate(fromDate, "fromDate");
  const endDate = normalizeDate(toDate, "toDate");

  if (startDate > endDate) {
    throw new Error("fromDate cannot be greater than toDate");
  }

  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
};

class MealExtensionService {
  async requestExtension({ userId, paymentId, fromDate, toDate, reason } = {}) {
    if (!userId || !paymentId) {
      throw new Error("User ID and payment ID are required");
    }

    if (!reason || !reason.trim()) {
      throw new Error("Reason is required");
    }

    const payment = await Payment.findOne({ _id: paymentId });

    if (!payment) {
      throw new Error("Your paymentId is not valid");
    }

    if (payment.userId?.toString() !== userId.toString()) {
      throw new Error("Your paymentId and userId do not match");
    }

    const normalizedFromDate = normalizeDate(fromDate, "fromDate");
    const normalizedToDate = normalizeDate(toDate, "toDate");

    if (normalizedFromDate > normalizedToDate) {
      throw new Error("fromDate cannot be greater than toDate");
    }

    const mealUsages = await Meal_Usage.find({
      userId,
      mealDate: {
        $gte: normalizedFromDate,
        $lte: normalizedToDate,
      },
    });

    if (!mealUsages.length) {
      throw new Error("No valid meal records found for the selected date range");
    }

    const hasUsedMeal = mealUsages.some((meal) => meal.used === true);

    if (!hasUsedMeal) {
      throw new Error("No meals were used in the selected date range");
    }

    const duplicateRequest = await MealExtension.findOne({
      userId,
      paymentId,
      status: { $in: ["pending", "approved"] },
      fromDate: { $lte: normalizedToDate },
      toDate: { $gte: normalizedFromDate },
    });

    if (duplicateRequest) {
      throw new Error("A similar extension request already exists");
    }

    const extensionRequest = await MealExtension.create({
      userId,
      paymentId,
      fromDate: normalizedFromDate,
      toDate: normalizedToDate,
      numberOfDays: calculateNumberOfDays(normalizedFromDate, normalizedToDate),
      reason: reason.trim(),
    });

    return extensionRequest;
  }


  async approveExtension(extensionId, adminId) {
    if (!extensionId) {
      throw new Error("Extension ID is required");
    }

    if (!adminId) {
      throw new Error("Admin ID is required");
    }

    const extension = await MealExtension.findOne({
      _id: extensionId,
      status: "pending",
    });

    if (!extension) {
      throw new Error("Meal extension request is not found or already processed");
    }

    const payment = await Payment.findById(extension.paymentId);

    if (!payment) {
      throw new Error("Related payment record not found");
    }

    const mealTypeList = payment.mealType === "fullday" ? mealTypes : [payment.mealType];
    const startDate = normalizeDate(extension.fromDate, "fromDate");
    const endDate = normalizeDate(extension.toDate, "toDate");
    const currentDate = new Date(startDate);

    await Meal_Usage.updateMany(
      {
        userId: extension.userId,
        paymentId: extension.paymentId,
        mealDate: {
          $gte: startDate,
          $lt: new Date(endDate.getTime() + 86400000),
        },
        used: false,
      },
      { $set: { entitled: false } }
    );

    for (; currentDate <= endDate; currentDate.setUTCDate(currentDate.getUTCDate() + 1)) {
      const mealDate = new Date(currentDate);

      for (const mealType of mealTypeList) {
        const mealUsageId = `${extension.paymentId}-${mealDate.toISOString().slice(0, 10)}-${mealType}`;

        await Meal_Usage.findOneAndUpdate(
          {
            userId: extension.userId,
            paymentId: extension.paymentId,
            mealType,
            mealDate: {
              $gte: new Date(Date.UTC(mealDate.getUTCFullYear(), mealDate.getUTCMonth(), mealDate.getUTCDate())),
              $lt: new Date(Date.UTC(mealDate.getUTCFullYear(), mealDate.getUTCMonth(), mealDate.getUTCDate() + 1)),
            },
          },
          {
            $set: {
              mealUsageId,
              entitled: true,
              used: false,
              verifiedBy: null,
              verificationMethod: null,
              usedAt: null,
            },
            $setOnInsert: {
              userId: extension.userId,
              paymentId: extension.paymentId,
              mealType,
              mealDate: new Date(Date.UTC(mealDate.getUTCFullYear(), mealDate.getUTCMonth(), mealDate.getUTCDate())),
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      }
    }

    extension.status = "approved";
    extension.approvedBy = adminId;
    extension.approvedAt = new Date();

    await extension.save();

    return extension;
  }
}

export default new MealExtensionService();