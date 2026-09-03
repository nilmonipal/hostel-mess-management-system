import crypto from "crypto";
import Meal_QR from "../models/qrCodes.models.js";
import MealUsageService from "./mealUsage.service.js";
import QRCode from "qrcode";

const mealTypes = ["breakfast", "lunch", "dinner"];
const QR_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes expiry

class QRService {
  async generateQR({ userId, mealType, mealDate = new Date() }) {
    if (!userId || !mealTypes.includes(mealType)) {
      throw new Error("User ID and a valid meal type are required");
    }

    const mealUsage = await MealUsageService.checkMealEligibility(userId, mealType, mealDate);
    if (!mealUsage) {
      throw new Error("You have no eligible meal left for this date");
    }

    await Meal_QR.updateMany(
      {
        userId,
        mealUsageId: mealUsage._id,
        status: "active",
      },
      {
        $set: { status: "expired" },
      }
    );

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const generatedAt = new Date();
    const qrId = crypto.randomUUID();

    const qr = await Meal_QR.create({
      qrId,
      tokenHash,
      userId,
      mealUsageId: mealUsage._id,
      mealType,
      mealDate: mealUsage.mealDate,
      generatedAt,
      expiresAt: new Date(generatedAt.getTime() + QR_EXPIRY_MS),
      status: "active",
    });

    const qrImage = await QRCode.toDataURL(
    JSON.stringify({
    type: "MESS_MEAL_QR",
    token,
      })
    );

    return {
      token,
      qrData: JSON.stringify({ qrId, token }),
      qr,
      qrImage: qrImage

    };
  }
  async generateQRImage(token){

    const qrImage = await QRCode.toDataURL(
    JSON.stringify({
    type: "MESS_MEAL_QR",
    token,
      })
    );

    return {
    qrImage: qrImage
    }

  }

}
export default new QRService();
    