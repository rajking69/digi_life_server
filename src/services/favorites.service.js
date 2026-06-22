const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getFavoritesCollection = () => client.db(process.env.DB_NAME).collection("favorites");
const getLessonsCollection = () => client.db(process.env.DB_NAME).collection("lessons");

const createFavorite = async (userId, lessonId) => {
    const favoritesCollection = getFavoritesCollection();
    const lessonsCollection = getLessonsCollection();

    // Check if the lesson exists
    const lessonExists = await lessonsCollection.findOne({ _id: new ObjectId(lessonId) });
    if (!lessonExists) {
        const error = new Error("Lesson not found");
        error.statusCode = 404;
        throw error;
    }

    // Check for duplicate favorite
    const existingFavorite = await favoritesCollection.findOne({ 
        userId: new ObjectId(userId), 
        lessonId: new ObjectId(lessonId) 
    });
    
    if (existingFavorite) {
        const error = new Error("Lesson is already in favorites.");
        error.statusCode = 409;
        throw error;
    }

    const newFavorite = {
        userId: new ObjectId(userId),
        lessonId: new ObjectId(lessonId),
        savedAt: new Date()
    };

    const result = await favoritesCollection.insertOne(newFavorite);
    
    // Increment favoritesCount in the lessons collection
    await lessonsCollection.updateOne(
        { _id: new ObjectId(lessonId) },
        { $inc: { favoritesCount: 1 } }
    );

    return { _id: result.insertedId, ...newFavorite };
};

const getFavoritesByUserId = async (userId, query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const favoritesCollection = getFavoritesCollection();
    
    // Using aggregation to join lesson data
    const pipeline = [
        { $match: { userId: new ObjectId(userId) } },
        { $sort: { savedAt: -1 } },
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
        { $unwind: "$lesson" }
    ];

    const totalCount = await favoritesCollection.countDocuments({ userId: new ObjectId(userId) });
    const favorites = await favoritesCollection.aggregate(pipeline).toArray();

    return formatPaginatedResponse(favorites, totalCount, page, limit);
};

const deleteFavorite = async (id) => {
    const favoritesCollection = getFavoritesCollection();
    const lessonsCollection = getLessonsCollection();

    const favorite = await favoritesCollection.findOne({ _id: new ObjectId(id) });
    if (!favorite) {
        const error = new Error("Favorite not found");
        error.statusCode = 404;
        throw error;
    }

    await favoritesCollection.deleteOne({ _id: new ObjectId(id) });

    // Decrement favoritesCount in the lessons collection
    await lessonsCollection.updateOne(
        { _id: favorite.lessonId },
        { $inc: { favoritesCount: -1 } }
    );

    return { deletedCount: 1 };
};

module.exports = {
    createFavorite,
    getFavoritesByUserId,
    deleteFavorite
};
