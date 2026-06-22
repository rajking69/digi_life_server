const lessonsService = require("../services/lessons.service");
const { ObjectId } = require("mongodb");

const createLesson = async (req, res) => {
    try {
        const { title, description, category, emotionalTone, content } = req.body;

        if (!title || !description || !category || !emotionalTone || !content) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields."
            });
        }
        
        // Securely inject user details from token
        req.body.creatorId = req.user._id.toString();
        req.body.creatorName = req.user.name;
        req.body.creatorEmail = req.user.email;
        req.body.creatorPhoto = req.user.photoURL || "";

        const newLesson = await lessonsService.createLesson(req.body);
        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: newLesson
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getLessons = async (req, res) => {
    try {
        const result = await lessonsService.getLessons(req.query);
        res.status(200).json({
            success: true,
            message: "Lessons fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID format" });
        }

        const lesson = await lessonsService.getLessonById(id);

        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lesson fetched successfully",
            data: lesson
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID format" });
        }

        const lesson = await lessonsService.getLessonById(id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        const updateKeys = Object.keys(updateData);
        // Allow any logged-in user to like a lesson. 
        // We ensure they are only updating 'likes' to prevent malicious edits.
        const isOnlyLiking = updateKeys.length === 1 && updateKeys[0] === 'likes';

        if (!isOnlyLiking) {
            if (lesson.creatorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
                return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to modify this lesson" });
            }
        } else {
            // Automatically update likesCount
            updateData.likesCount = Array.isArray(updateData.likes) ? updateData.likes.length : 0;
        }

        const updatedLesson = await lessonsService.updateLesson(id, updateData);

        if (!updatedLesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: updatedLesson
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID format" });
        }

        const lesson = await lessonsService.getLessonById(id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        if (lesson.creatorId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to delete this lesson" });
        }

        const result = await lessonsService.deleteLesson(id);

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLessonById,
    updateLesson,
    deleteLesson
};
