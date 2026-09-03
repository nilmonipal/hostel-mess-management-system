import crypto from "crypto";
import Meal_QR from "../models/qrCodes.models.js";
import Meal_Usage from "../models/meal_Usage.models.js";
import mealUsageService from "./mealUsage.service.js";
import qrVerification from "../models/qrVerification.models.js";

class QRVerificationSercice{
    async verifyQR(token, adminId){
        if (!token) {
            throw new Error("QR token is required");
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const qr = await Meal_QR.findOne({
            tokenHash
        });

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
            mealDate: qr.mealDate
        }; 

    }

    async acceptQR (qrId, adminId) {

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

        await Meal_QR.deleteOne({_id: qr._id});
        return {
            valid : true,
            message : "You can enjoy your meal",
            mealUsage:mealUsage,
        }
    }

    async declineQR(qrId, adminId){
      const result = await qrVerification.create({
            qrId:qrId,
            mealUsageId: null,
            verifiedBy: adminId,
            status:"rejected",
            rejectionReason:"Declined meal for a moment",
            verifiedAt:new Date()
        })
        return{
            valid : true,
            data :result
        }
    }

}

export default new QRVerificationSercice();