class AdminDashboardService {
    async getStudents({ search = "", status = "", page = 1, limit = 10 }, User, Payment) {
        const keyword = typeof search === "string" ? search.trim() : "";
        const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
        const userQuery = { role: { $in: ["student", "user"] } };

        if (keyword) {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            userQuery.$or = [
                { studentId: { $regex: escapedKeyword, $options: "i" } },
                { name: { $regex: escapedKeyword, $options: "i" } },
                { email: { $regex: escapedKeyword, $options: "i" } },
                { phone: { $regex: escapedKeyword, $options: "i" } },
                { username: { $regex: escapedKeyword, $options: "i" } },
            ];
        }

        const now = new Date();
        if (status === "active" || status === "inactive") {
            const activePayments = await Payment.distinct("userId", {
                status: "paid",
                startDate: { $lte: now },
                endDate: { $gte: now },
            });
            userQuery._id = status === "active" ? { $in: activePayments } : { $nin: activePayments };
        }

        const [total, students] = await Promise.all([
            User.countDocuments(userQuery),
            User.find(userQuery)
                .select("name studentId email phone username course createdAt")
                .sort({ name: 1, _id: 1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),
        ]);

        const activeStudentIds = students.length
            ? await Payment.distinct("userId", {
                userId: { $in: students.map((student) => student._id) },
                status: "paid",
                startDate: { $lte: now },
                endDate: { $gte: now },
            })
            : [];
        const activeSet = new Set(activeStudentIds.map((id) => id.toString()));

        return {
            data: students.map((student) => ({
                ...student,
                status: activeSet.has(student._id.toString()) ? "active" : "inactive",
            })),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages: Math.ceil(total / safeLimit),
            },
        };
    }

    async getTransactions({ search = "", status = "", fromDate, toDate, page = 1, limit = 10 }, Payment, User) {
        const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
        const query = {};
        const allowedStatuses = ["pending", "paid", "completed", "failed"];
        if (allowedStatuses.includes(status)) query.status = status;

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                const start = new Date(fromDate);
                if (Number.isNaN(start.getTime())) throw new Error("fromDate must be a valid date");
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (toDate) {
                const end = new Date(toDate);
                if (Number.isNaN(end.getTime())) throw new Error("toDate must be a valid date");
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const keyword = typeof search === "string" ? search.trim() : "";
        if (keyword) {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const matchedStudents = await User.find({
                $or: [
                    { name: { $regex: escapedKeyword, $options: "i" } },
                    { studentId: { $regex: escapedKeyword, $options: "i" } },
                    { email: { $regex: escapedKeyword, $options: "i" } },
                    { phone: { $regex: escapedKeyword, $options: "i" } },
                ],
            }).distinct("_id");
            query.userId = { $in: matchedStudents };
        }

        const [total, transactions] = await Promise.all([
            Payment.countDocuments(query),
            Payment.find(query)
                .select("userId mealType numberOfMeals totalAmount status paymentDate paidAt createdAt startDate endDate razorpayOrderId razorpayPaymentId")
                .populate("userId", "name studentId email phone")
                .sort({ createdAt: -1, _id: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),
        ]);

        return {
            data: transactions,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                pages: Math.ceil(total / safeLimit),
            },
        };
    }

    async getReports({ fromDate, toDate }, Payment, MealUsage, User, MealExtension) {
        const start = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = toDate ? new Date(toDate) : new Date();
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
            throw new Error("A valid date range is required");
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const paymentMatch = { createdAt: { $gte: start, $lte: end } };
        const mealMatch = { mealDate: { $gte: start, $lte: end } };
        const [paymentSummary, paymentTransactions, mealsByType, students, pendingExtensions] = await Promise.all([
            Payment.aggregate([
                { $match: paymentMatch },
                {
                    $group: {
                        _id: null,
                        transactionCount: { $sum: 1 },
                        paidCount: { $sum: { $cond: [{ $in: ["$status", ["paid", "completed"]] }, 1, 0] } },
                        pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        revenue: { $sum: { $cond: [{ $in: ["$status", ["paid", "completed"]] }, "$totalAmount", 0] } },
                    },
                },
            ]),
            Payment.find(paymentMatch)
                .select("userId mealType numberOfMeals totalAmount status paymentDate createdAt paidAt")
                .populate("userId", "name studentId email")
                .sort({ createdAt: -1 })
                .lean(),
            MealUsage.aggregate([
                { $match: mealMatch },
                {
                    $group: {
                        _id: "$mealType",
                        records: { $sum: 1 },
                        consumed: { $sum: { $cond: ["$used", 1, 0] } },
                        entitled: { $sum: { $cond: ["$entitled", 1, 0] } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            User.countDocuments({ role: { $in: ["student", "user"] }, createdAt: { $lte: end } }),
            MealExtension.countDocuments({ status: "pending", createdAt: { $gte: start, $lte: end } }),
        ]);

        return {
            fromDate: start,
            toDate: end,
            payments: paymentSummary[0] || {
                transactionCount: 0,
                paidCount: 0,
                pendingCount: 0,
                revenue: 0,
            },
            paymentTransactions,
            mealsByType,
            students,
            pendingExtensions,
        };
    }

    // Fetch today's overviews
    async getTodayOverviews(Payment,user_model,Meal_Usage){
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(today);
        startOfTomorrow.setDate(today.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);
        const regesteredStudent = await user_model.countDocuments({ role: { $in: ["student", "user"] } });
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
        const revenueResult = await Payment.aggregate([
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
                    $sum: "$totalAmount"
                    }
                }
            }
        ]);
        

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;
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
                    totalRevenue: { $sum: "$totalAmount" },
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


