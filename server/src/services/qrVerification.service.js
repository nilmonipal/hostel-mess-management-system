import crypto from "crypto";
import Meal_QR from "../models/qrCodes.models.js";
import Meal_Usage from "../models/meal_Usage.models.js";
import mealUsageService from "./mealUsage.service.js";
import qrVerification from "../models/qrVerification.models.js";

class QRVerificationSercice{
    async verifyQR(token){
        if (!token) {
            throw new Error("QR token is required");
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const qr = await Meal_QR.findOne({
            tokenHash
        }).populate("userId", "name username studentId");

        if (!qr) {
            return {
            valid: false,
            reason: "INVALID_QR"
            };
        }

        if (qr.status !== "active") {
            return {
            valid: false,
            reason: "QR_NOT_ACTIVE"
            };
        }

        if (qr.expiresAt <= new Date()) {
        return {
        valid: false,
        reason: "QR_EXPIRED"
        };
        }

        const eligibility = await mealUsageService.checkMealEligibility(
        qr.userId,
        qr.mealType,
        qr.mealDate
        )

        if(!eligibility){
            return{
                valid: false,
                reason: "NOT_ELIGIBLE_FOR_MEAL"
            }
        }

         return {
            valid: true,
            status: "pending",
            qrId: qr.qrId,
            mealUsageId: qr.mealUsageId,
            mealType: qr.mealType,
            mealDate: qr.mealDate,
            expiresAt: qr.expiresAt,
            student: qr.userId ? {
                name: qr.userId.name || qr.userId.username,
                studentId: qr.userId.studentId
            } : null
        }; 

    }

    async acceptQR (qrId, adminId) {
        if (!adminId) {
            throw new Error("Admin ID is required");
        }

        const qr = await Meal_QR.findOne({ qrId: qrId });

        if(!qr){
            throw new Error("Your Qr is Invalid");
        }

        if(qr.status != "active"){
            throw new Error("QR_Expired or not active");
        }

        const mealUsage = await Meal_Usage.findOneAndUpdate(
            {
            _id: qr.mealUsageId,
            entitled: true,
            used: false
            },
            {
            $set: {
                used: true,
                usedAt: new Date(),
                verifiedBy: adminId,
                verificationMethod: "qr"
            }
            },
            {
            new: true
            }
        );

        if (!mealUsage) {
            throw new Error("Meal is no longer eligible or has already been used");
        }

        await qrVerification.create({
            qrId: qr.qrId,
            mealUsageId: mealUsage._id,
            verifiedBy: adminId,
            status: "accepted",
            verifiedAt: new Date()
        });
        await Meal_QR.deleteOne({ _id: qr._id });
        return {
            valid : true,
            message : "You can enjoy your meal",
            mealUsage:mealUsage,
        }
    }

    async declineQR(qrId, adminId, rejectionReason = "Declined by admin"){
      if (!adminId) {
        throw new Error("Admin ID is required");
      }
      const qr = await Meal_QR.findOne({ qrId });
      if (!qr || qr.status !== "active" || qr.expiresAt <= new Date()) {
        throw new Error("QR is invalid, expired, or no longer active");
      }
      const result = await qrVerification.create({
            qrId: qr.qrId,
            mealUsageId: qr.mealUsageId,
            verifiedBy: adminId,
            status: "rejected",
            rejectionReason: typeof rejectionReason === "string" && rejectionReason.trim()
                ? rejectionReason.trim().slice(0, 500)
                : "Declined by admin",
            verifiedAt: new Date()
        });
      await Meal_QR.deleteOne({ _id: qr._id });
        return{
            valid : true,
            data :result
        }
    }

}

export default new QRVerificationSercice();