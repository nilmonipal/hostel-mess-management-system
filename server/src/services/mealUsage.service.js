import MealUsage from "../models/meal_Usage.models.js";

const mealTypes = ["breakfast", "lunch", "dinner"];

const toDate = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
};

const startOfDay = (value, fieldName = "mealDate") => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  const date = toDate(value, fieldName);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const dateKey = (date) => date.toISOString().slice(0, 10);

class MealUsageService {
  async generateMealUsages(payment) {
    if (!payment?._id || !payment.userId) {
      throw new Error("A valid payment is required");
    }

    const startDate = startOfDay(payment.startDate, "startDate");

    const numberOfMeals = Number(payment.numberOfMeals);
    const endDate = payment.endDate ? startOfDay(payment.endDate) : null;
    const mealCount = Number.isInteger(numberOfMeals) && numberOfMeals > 0
      ? numberOfMeals
      : endDate
        ? Math.floor((endDate - startDate) / 86400000) + 1
        : 0;

    if (mealCount < 1) {
      throw new Error("Payment must contain at least one meal");
    }

    const meals = payment.mealType === "fullday"
      ? mealTypes
      : [payment.mealType];

    if (!meals.every((mealType) => mealTypes.includes(mealType))) {
      throw new Error("Payment contains an invalid meal type");
    }

    const usages = [];

    for (let day = 0; day < mealCount; day += 1) {
      const mealDate = new Date(startDate);
      mealDate.setUTCDate(startDate.getUTCDate() + day);

      for (const mealType of meals) {
        const mealUsageId = `${payment._id}-${dateKey(mealDate)}-${mealType}`;
        //
        const nextMealDate = new Date(mealDate);
        nextMealDate.setUTCDate(nextMealDate.getUTCDate() + 1);
        const usage = await MealUsage.findOneAndUpdate(
          {
            userId: payment.userId,
            paymentId: payment._id,
            mealDate: { $gte: mealDate, $lt: nextMealDate },
            mealType,
          },
//
          {
            $set: {
              mealUsageId,
            },
            $setOnInsert: {
              userId: payment.userId,
              paymentId: payment._id,
              mealType,
              mealDate,
              entitled: true,
              used: false,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        usages.push(usage);
      }
    }

    return usages;
  }

  async checkMealEligibility(userId, mealType, mealDate) {
    if (!userId || !mealTypes.includes(mealType)) {
      throw new Error("User ID and a valid meal type are required");
    }

    return MealUsage.findOne({
      userId,
      mealType,
      mealDate: {
        $gte: startOfDay(mealDate),
        $lt: new Date(startOfDay(mealDate).getTime() + 86400000),
      },
      entitled: true,
      used: false,
    });
  }

  async markMealAsUsed({ userId, mealType, mealDate, adminId, verificationMethod }) {
    if (!userId || !adminId || !mealTypes.includes(mealType)) {
      throw new Error("User ID, admin ID, and a valid meal type are required");
    }

    if (!["qr", "rfid"].includes(verificationMethod)) {
      throw new Error("A valid verification method is required");
    }

    const normalizedDate = startOfDay(mealDate);
    const usage = await MealUsage.findOneAndUpdate(
      {
        userId,
        mealType,
        mealDate: { $gte: normalizedDate, $lt: new Date(normalizedDate.getTime() + 86400000) },
        entitled: true,
        used: false,
      },
      { $set: { used: true, usedAt: new Date(), verifiedBy: adminId, verificationMethod } },
      { new: true }
    );

    if (!usage) {
      throw new Error("Meal is not eligible or has already been used");
    }

    return usage;
  }

  async getTodayMealUsage(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const today = startOfDay(new Date());
    return MealUsage.find({
      userId,
      mealDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    }).sort({ mealDate: 1, mealType: 1 });
  }

  async getMealHistory(userId, filters = {}) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const query = { userId };
    if (filters.mealType) query.mealType = filters.mealType;
    if (filters.used !== undefined) query.used = filters.used === true || filters.used === "true";
    if (filters.entitled !== undefined) query.entitled = filters.entitled === true || filters.entitled === "true";

    if (filters.startDate || filters.endDate) {
      query.mealDate = {};
      if (filters.startDate) query.mealDate.$gte = startOfDay(filters.startDate);
      if (filters.endDate) query.mealDate.$lt = new Date(startOfDay(filters.endDate).getTime() + 86400000);
    }

    return MealUsage.find(query).sort({ mealDate: -1, mealType: 1 });
  }

  async getMealUsageById(mealUsageId) {
    if (!mealUsageId) {
      throw new Error("Meal usage ID is required");
    }

    return MealUsage.findOne({ mealUsageId });
  }
}

export default new MealUsageService();