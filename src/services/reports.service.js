const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getReportsCollection = () => client.db(process.env.DB_NAME).collection("lessonsReports");
const getLessonsCollection = () => client.db(process.env.DB_NAME).collection("lessons");

const createReport = async (reportData) => {
    const reportsCollection = getReportsCollection();
    const lessonsCollection = getLessonsCollection();

    // Check if the lesson exists
    const lessonExists = await lessonsCollection.findOne({ _id: new ObjectId(reportData.lessonId) });
    if (!lessonExists) {
        const error = new Error("Lesson not found");
        error.statusCode = 404;
        throw error;
    }

    // Check for duplicate report from same user for same lesson
    const existingReport = await reportsCollection.findOne({ 
        lessonId: new ObjectId(reportData.lessonId),
        reporterUserId: new ObjectId(reportData.reporterUserId)
    });

    if (existingReport) {
        const error = new Error("You have already reported this lesson.");
        error.statusCode = 409;
        throw error;
    }

    const newReport = {
        lessonId: new ObjectId(reportData.lessonId),
        reporterUserId: new ObjectId(reportData.reporterUserId),
        reporterEmail: reportData.reporterEmail,
        reason: reportData.reason,
        timestamp: new Date()
    };

    const result = await reportsCollection.insertOne(newReport);
    return { _id: result.insertedId, ...newReport };
};

const getReports = async (query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const reportsCollection = getReportsCollection();

    const pipeline = [
        { $sort: { timestamp: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "lessons",
                localField: "lessonId",
                foreignField: "_id",
                as: "lesson"
            }
        },
        { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } }
    ];

    const totalCount = await reportsCollection.countDocuments({});
    const reports = await reportsCollection.aggregate(pipeline).toArray();

    return formatPaginatedResponse(reports, totalCount, page, limit);
};

const deleteReport = async (id) => {
    const reportsCollection = getReportsCollection();

    const result = await reportsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
        const error = new Error("Report not found");
        error.statusCode = 404;
        throw error;
    }

    return { deletedCount: 1 };
};

module.exports = {
    createReport,
    getReports,
    deleteReport
};
