import mealPriceAndTimeModel from "../models/mealPrice_Timings.models.js";


class MealPriceAndTimeService {
  async addMealPriceAndTime(data) {
    const {mealId, mealType, mealPrice, startTime, endTime, qrGenerationTime } = data;
    try {
        if(!mealId || !mealType || !mealPrice || !startTime || !endTime || !qrGenerationTime) {
            throw new Error("Missing required fields");
        }

        const newMealPriceAndTime = new mealPriceAndTimeModel({
            mealId,
            mealType,
            mealPrice,
            startTime,
            endTime,
            qrGenerationTime
        });
        const savedMealPriceAndTime = await newMealPriceAndTime.save();
        return savedMealPriceAndTime;
        } catch (error) {
            throw error;
        }
    }

    // service to get all meal price and time details
    async getMealPriceAndTime() {
        try {
            const mealPriceAndTimeList = await mealPriceAndTimeModel.find();
            return mealPriceAndTimeList;
        } catch (error) {
            throw error;
        }
    }


    async updateMealPriceAndTime( mealType, mealPrice, startTime, endTime, qrGenerationTime) {
        try {
            if( !mealType || !mealPrice || !startTime || !endTime || !qrGenerationTime) {
                throw new Error("Missing required fields");
            }

            const updatedMealPriceAndTime = await mealPriceAndTimeModel.findOneAndUpdate(
                { mealType },
                {
                    mealType,
                    mealPrice,
                    startTime,
                    endTime,
                    qrGenerationTime
                },
                { new: true }
            );
            return updatedMealPriceAndTime;
        } catch (error) {
            throw error;
        }
    }

}

export default new MealPriceAndTimeService();
