const commentsService = require("../services/comments.service");
const { ObjectId } = require("mongodb");

const createComment = async (req, res) => {
    try {
        const { lessonId, text } = req.body;
        const userId = req.user._id.toString();
        const userName = req.user.name;
        const userPhoto = req.user.photoURL || "";

        if (!lessonId || !text) {
            return res.status(400).json({
                success: false,
                message: "lessonId and text are required fields."
            });
        }

        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid lessonId format" });
        }

        const newComment = await commentsService.createComment({ 
            lessonId, 
            userId, 
            userName, 
            userPhoto, 
            text 
        });
        
        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: newComment
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid lessonId format" });
        }

        const result = await commentsService.getCommentsByLessonId(lessonId, req.query);
        res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid comment ID format" });
        }
        
        if (!text) {
            return res.status(400).json({ success: false, message: "Text is required to update a comment." });
        }

        const comment = await commentsService.getCommentById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // Check permissions: Admin can edit any, Premium user can edit THEIR OWN.
        const isAdmin = req.user.role === "admin";
        const isPremiumOwner = req.user.isPremium && comment.userId.toString() === req.user._id.toString();

        if (!isAdmin && !isPremiumOwner) {
            return res.status(403).json({ success: false, message: "Forbidden: You must be a premium user to edit your comment, or an admin to edit any comment." });
        }

        const updatedComment = await commentsService.updateComment(id, text);

        res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            data: updatedComment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid comment ID format" });
        }

        const comment = await commentsService.getCommentById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        // Check permissions: Admin can delete any, Premium user can delete THEIR OWN.
        const isAdmin = req.user.role === "admin";
        const isPremiumOwner = req.user.isPremium && comment.userId.toString() === req.user._id.toString();

        if (!isAdmin && !isPremiumOwner) {
            return res.status(403).json({ success: false, message: "Forbidden: You must be a premium user to delete your comment, or an admin to delete any comment." });
        }

        await commentsService.deleteComment(id);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            data: null
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    createComment,
    getComments,
    updateComment,
    deleteComment
};
