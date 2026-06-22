const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getCommentsCollection = () => client.db(process.env.DB_NAME).collection("comments");
const getLessonsCollection = () => client.db(process.env.DB_NAME).collection("lessons");

const createComment = async (commentData) => {
    const commentsCollection = getCommentsCollection();
    const lessonsCollection = getLessonsCollection();

    // Check if the lesson exists
    const lessonExists = await lessonsCollection.findOne({ _id: new ObjectId(commentData.lessonId) });
    if (!lessonExists) {
        const error = new Error("Lesson not found");
        error.statusCode = 404;
        throw error;
    }

    const newComment = {
        lessonId: new ObjectId(commentData.lessonId),
        userId: new ObjectId(commentData.userId),
        userName: commentData.userName,
        userPhoto: commentData.userPhoto || "",
        text: commentData.text,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await commentsCollection.insertOne(newComment);
    
    // Increment commentsCount in the lessons collection
    await lessonsCollection.updateOne(
        { _id: new ObjectId(commentData.lessonId) },
        { $inc: { commentsCount: 1 } }
    );

    return { _id: result.insertedId, ...newComment };
};

const getCommentsByLessonId = async (lessonId, query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const commentsCollection = getCommentsCollection();
    
    // Sort by createdAt descending (newest first)
    const filter = { lessonId: new ObjectId(lessonId) };
    const totalCount = await commentsCollection.countDocuments(filter);
    const comments = await commentsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
        
    return formatPaginatedResponse(comments, totalCount, page, limit);
};

const deleteComment = async (id) => {
    const commentsCollection = getCommentsCollection();
    const lessonsCollection = getLessonsCollection();

    const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });
    if (!comment) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    await commentsCollection.deleteOne({ _id: new ObjectId(id) });

    // Decrement commentsCount in the lessons collection
    await lessonsCollection.updateOne(
        { _id: comment.lessonId },
        { $inc: { commentsCount: -1 } }
    );

    return { deletedCount: 1 };
};

const getCommentById = async (id) => {
    const commentsCollection = getCommentsCollection();
    return await commentsCollection.findOne({ _id: new ObjectId(id) });
};

const updateComment = async (id, text) => {
    const commentsCollection = getCommentsCollection();
    
    const result = await commentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                text: text, 
                updatedAt: new Date() 
            } 
        },
        { returnDocument: "after" }
    );
    
    return result;
};

module.exports = {
    createComment,
    getCommentsByLessonId,
    deleteComment,
    getCommentById,
    updateComment
};
