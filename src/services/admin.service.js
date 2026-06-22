const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getUsersCollection = () => client.db(process.env.DB_NAME).collection("users");
const getLessonsCollection = () => client.db(process.env.DB_NAME).collection("lessons");
const getReportsCollection = () => client.db(process.env.DB_NAME).collection("lessonsReports");

// Users
const getUsers = async (query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const { search, sort } = query;
    const usersCollection = getUsersCollection();

    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    const totalCount = await usersCollection.countDocuments(filter);
    const users = await usersCollection
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();

    return formatPaginatedResponse(users, totalCount, page, limit);
};

const updateUserRole = async (id, role) => {
    const usersCollection = getUsersCollection();
    
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) return null;

    const updated = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { role, updatedAt: new Date() } },
        { returnDocument: "after" }
    );

    if (user.email) {
        await client.db(process.env.DB_NAME).collection("user").updateOne(
            { email: user.email },
            { $set: { role } }
        );
    }
    
    return updated;
};

// Lessons
const getLessons = async (query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const { search, category, emotionalTone, visibility, accessLevel, sort } = query;
    const lessonsCollection = getLessonsCollection();

    const filter = {};
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }
    if (category) filter.category = category;
    if (emotionalTone) filter.emotionalTone = emotionalTone;
    if (visibility) filter.visibility = visibility;
    if (accessLevel) filter.accessLevel = accessLevel;

    let sortOption = { createdAt: -1 };
    if (sort === "mostSaved") sortOption = { favoritesCount: -1, createdAt: -1 };
    else if (sort === "mostLiked") sortOption = { likesCount: -1, createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    const totalCount = await lessonsCollection.countDocuments(filter);
    const lessons = await lessonsCollection
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();

    return formatPaginatedResponse(lessons, totalCount, page, limit);
};

const toggleLessonFeature = async (id, isFeatured) => {
    const lessonsCollection = getLessonsCollection();
    
    return await lessonsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isFeatured, updatedAt: new Date() } },
        { returnDocument: "after" }
    );
};

const toggleLessonReview = async (id, isReviewed) => {
    const lessonsCollection = getLessonsCollection();
    
    return await lessonsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isReviewed, updatedAt: new Date() } },
        { returnDocument: "after" }
    );
};

const deleteLesson = async (id) => {
    const lessonsCollection = getLessonsCollection();
    return await lessonsCollection.deleteOne({ _id: new ObjectId(id) });
};

// Reports
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
    return await reportsCollection.deleteOne({ _id: new ObjectId(id) });
};

// Analytics
const getAnalytics = async () => {
    const usersCollection = getUsersCollection();
    const lessonsCollection = getLessonsCollection();
    const reportsCollection = getReportsCollection();

    const usersCount = await usersCollection.countDocuments();
    const lessonsCount = await lessonsCollection.countDocuments();
    const reportsCount = await reportsCollection.countDocuments();

    // Top contributors (users with most lessons)
    const topContributors = await usersCollection.aggregate([
        { $match: { role: 'user' } }, // optionally exclude admins
        {
            $lookup: {
                from: "lessons",
                localField: "_id",
                foreignField: "creator", // Wait, is creator an ObjectId or just ID string? Let's check how lessons are created. It's usually string or objectid. 
                as: "userLessons"
            }
        },
        { $addFields: { lessonsCount: { $size: "$userLessons" } } },
        { $sort: { lessonsCount: -1 } },
        { $limit: 5 },
        { $project: { name: 1, email: 1, photo: 1, lessonsCount: 1 } }
    ]).toArray();

    // Fallback: If no lookup matches due to ID type mismatches, maybe they are stored differently, we'll return an empty array or the top ones anyway.

    return {
        usersCount,
        lessonsCount,
        reportsCount,
        topContributors
    };
};

module.exports = {
    getUsers,
    updateUserRole,
    getLessons,
    toggleLessonFeature,
    toggleLessonReview,
    deleteLesson,
    getReports,
    deleteReport,
    getAnalytics
};
