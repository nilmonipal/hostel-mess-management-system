class AdminDashboardService {


    // Fetch today's overviews
    async getTodayOverviews(Payment,user_model,Meal_Usage){
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);
        const regesteredStudent = await user_model.countDocuments({ role: "student" });
        const result = await Payment.aggregate([
                {
                    $match: {
                    status: "paid",
                    startDate: { $lte: today },
                    endDate: { $gte: today }
                    }
                },
                {
                    $group: {
                    _id: "$userId" // Deduplicate by student/user ID
                    }
                },
                {
                    $group: {
                    _id: null,
                    totalPaidStudents: { $sum: 1 } // Count unique IDs
                    }
                }
                ]);

        const paidStudent = result[0]?.totalPaidStudents || 0;
        const studentsWithoutActivePlan = regesteredStudent - paidStudent;
        const mealUsageCount = await Meal_Usage.countDocuments({ mealDate: today, used: true });
        const totalRevenue = await Payment.aggregate([
            {
                $match: {
                    status: "paid",
                    paymentDate: {
                        $gte: today,
                        $lt: startOfTomorrow
                        }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                    $sum: "$amount"
                    }
                }
            }
        ]);
        

        return { regesteredStudent, paidStudent, studentsWithoutActivePlan, mealUsageCount, totalRevenue };    
    }


    // Fetch Meal Statistics
    async getMealStatistics(Meal_Usage) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);

        const result = await Meal_Usage.aggregate([
            {
                $match: {
                    entitled: true,
                    mealDate: {
                        $gte: today,
                        $lt: startOfTomorrow,
                    },
                },
            },
            {
                $group: {
                    _id: "$mealType",
                    entitled: { $sum: 1 },
                    served: {
                        $sum: {
                            $cond: [{ $eq: ["$used", true] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    mealType: "$_id",
                    entitled: 1,
                    served: 1,
                    remaining: {
                        $subtract: ["$entitled", "$served"],
                    },
                },
            },
            {
                $sort: { mealType: 1 },
            },
        ]);

        return result;
    }

    async getRecentPaymentStatus(Payment) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);

        const result = await Payment.aggregate([
            {
                $match: {
                    paymentDate: {
                        $gte: today,
                        $lt: startOfTomorrow,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]);

        return result[0] || { totalPayments: 0, totalRevenue: 0 };
    }


    async getRecentMealActivity(qrVerification){
         const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);


        const activities = await qrVerification.find({
            verifiedAt: {
                $gte: today,
                $lt: startOfTomorrow,
            },
        })
            .sort({ verifiedAt: -1 })
            .limit(10)
            .populate({
                path: "mealUsageId",
                populate: {
                path: "userId",
                select: "name studentId"
                }
            })
            .populate({
                path: "verifiedBy",
                select: "name"
            });

            return activities.map((activity) => ({
                studentName: activity.mealUsageId?.userId?.name,
                studentId: activity.mealUsageId?.userId?.studentId,
                adminName: activity.verifiedBy?.name,
                mealType: activity.mealUsageId?.mealType,
                mealDate: activity.mealUsageId?.mealDate,
                action: activity.status,
                verificationTime: activity.verifiedAt
            }));
        
    }


    async searchStudent(search, Payment, user_model) {
        try {
            const keyword = typeof search === "string" ? search.trim() : "";

            if (!keyword) {
                return [];
            }

            const students = await user_model.find({
                role: "student",
                $or: [
                    { studentId: { $regex: keyword, $options: "i" } },
                    { name: { $regex: keyword, $options: "i" } },
                    { email: { $regex: keyword, $options: "i" } }
                ]
            })
            .select("name studentId email")
            .limit(20);

            if (students.length === 0) {
                return [];
            }

            const now = new Date();

            const results = await Promise.all(
                students.map(async (student) => {
                    const payment = await Payment.findOne({
                        userId: student._id,
                        status: "paid"
                    }).sort({ endDate: -1 });

                    if (!payment) {
                        return {
                            studentId: student.studentId,
                            studentName: student.name,
                            email: student.email,
                            planType: null,
                            status: "No Plan"
                        };
                    }

                    const isPlanActive =
                        now >= payment.startDate &&
                        now <= payment.endDate;

                    return {
                        studentId: student.studentId,
                        studentName: student.name,
                        email: student.email,
                        planType: payment.paymentType,
                        status: isPlanActive ? "Active" : "No Plan"
                    };
                })
            );

            return results;
        } catch (error) {
            throw error;
        }
    }




    async getStudentDetails(userId, user_model, Payment, MealUsage) {
        try {
            const student = await user_model.findOne({
                _id: userId,
                role: "student"
            }).select("name studentId email");

            if (!student) {
                throw new Error("Student not found");
            }

            const now = new Date();

            const currentPlan = await Payment.findOne({
                userId: student._id,
                status: "paid",
                startDate: { $lte: now },
                endDate: { $gte: now }
            })
            .sort({ endDate: -1 })
            .select("paymentType amount status paymentDate startDate endDate");

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const startOfTomorrow = new Date(startOfToday);
            startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

            const todayMeals = await MealUsage.find({
                userId: student._id,
                mealDate: {
                    $gte: startOfToday,
                    $lt: startOfTomorrow
                }
            })
            .select("mealType mealDate entitled used usedAt")
            .sort({ mealType: 1 });

            const paymentHistory = await Payment.find({
                userId: student._id
            })
            .sort({ paymentDate: -1 })
            .select("paymentType amount status paymentDate startDate endDate");

            const mealHistory = await MealUsage.find({
                userId: student._id
            })
            .sort({ mealDate: -1 })
            .select("mealType mealDate entitled used usedAt")
            .limit(50);

            return {
                student: {
                    studentId: student.studentId,
                    name: student.name,
                    email: student.email
                },
                currentPlan,
                todayMeals,
                paymentHistory,
                mealHistory
            };

        } catch (error) {
            throw error;
        }
    }
}

export default new AdminDashboardService();




