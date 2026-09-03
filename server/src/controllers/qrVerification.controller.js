import qrVerificationService from "../services/qrVerification.service.js";
import qrVerification from "../models/qrVerification.models.js";

export const QrVerify = async (req,res) =>{

    try {
        const { token } = req.body;
        const result = await qrVerificationService.verifyQR(token, req.user.id || req.user._id);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

}

export const acceptQR = async (req,res) => {
        try {
            const { qrId } = req.body;
            if (!qrId) {
                return res.status(400).json({
                    success: false,
                    message: "QR ID is required"
                });
            }
            const result = await qrVerificationService.acceptQR(qrId, req.user.id || req.user._id )
            
            try{
                await qrVerification.create({
                    qrId: qrId,
                    mealUsageId: result.mealUsage._id,
                    verifiedBy: result.mealUsage.verifiedBy,
                    status:"accepted",
                    verifiedAt: new Date()
                })
            }catch(error){
                console.error("Error creating verification record:", error);
            }
            
            return res.status(200).json({
                success: true,
                message:"Meal accepted successfully",
                data: result
            });
            
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Error accepting QR"
            })
        }
}

export const declineQR = async (req,res) => {
    try {
        const { qrId } = req.body;
        if (!qrId) {
            return res.status(400).json({
                success: false,
                message: "QR ID is required"
            });
        }
        const result = await qrVerificationService.declineQR(qrId, req.user.id || req.user._id )
        return res.status(200).json({
            success: true,
            message:"Meal Declined",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Error declining QR"
        })        
    }
}

export default{
    QrVerify,
    acceptQR,
    declineQR
}