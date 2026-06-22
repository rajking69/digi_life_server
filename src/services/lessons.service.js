const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getLessonsCollection = () => client.db(process.env.DB_NAME).collection("lessons");

const createLesson = async (lessonData) => {
    const lessonsCollection = getLessonsCollection();

    const newLesson = {
        title: lessonData.title,
        description: lessonData.description,
        category: lessonData.category,
        emotionalTone: lessonData.emotionalTone,
        content: lessonData.content || "",
        visibility: lessonData.visibility || "Public",
        accessLevel: lessonData.accessLevel || "Free",
        image: lessonData.image || "",
        creatorId: new ObjectId(lessonData.creatorId),
        creatorName: lessonData.creatorName,
        creatorEmail: lessonData.creatorEmail,
        creatorPhoto: lessonData.creatorPhoto || "",
        likes: [],
        likesCount: 0,
        favoritesCount: 0,
        commentsCount: 0,
        isFeatured: false,
        isReviewed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await lessonsCollection.insertOne(newLesson);
    return { _id: result.insertedId, ...newLesson };
};

const getLessons = async (query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const { search, category, emotionalTone, visibility, accessLevel, sort, creatorId } = query;
    const lessonsCollection = getLessonsCollection();

    const filter = {};
    if (creatorId) filter.creatorId = new ObjectId(creatorId);
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

    let sortOption = { createdAt: -1 }; // default newest
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

const getLessonById = async (id) => {
    const lessonsCollection = getLessonsCollection();
    return await lessonsCollection.findOne({ _id: new ObjectId(id) });
};

const updateLesson = async (id, updateData) => {
    const lessonsCollection = getLessonsCollection();
    
    const filteredUpdateData = { ...updateData };
    delete filteredUpdateData._id;
    delete filteredUpdateData.creatorId; 
    filteredUpdateData.updatedAt = new Date();

    const result = await lessonsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: filteredUpdateData },
        { returnDocument: "after" }
    );
    
    return result;
};

const deleteLesson = async (id) => {
    const lessonsCollection = getLessonsCollection();
    return await lessonsCollection.deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
};
