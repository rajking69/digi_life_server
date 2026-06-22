const adminService = require("../services/admin.service");
const { ObjectId } = require("mongodb");

// Users
const getUsers = async (req, res) => {
    try {
        const result = await adminService.getUsers(req.query);
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID format" });
        }

        if (role !== "admin" && role !== "user") {
            return res.status(400).json({ success: false, message: "Role must be 'admin' or 'user'" });
        }

        if (req.user._id.toString() === id && role !== "admin") {
            return res.status(403).json({ success: false, message: "You cannot demote yourself from admin status" });
        }

        const updatedUser = await adminService.updateUserRole(id, role);

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Lessons
const getLessons = async (req, res) => {
    try {
        const result = await adminService.getLessons(req.query);
        res.status(200).json({
            success: true,
            message: "Lessons fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const toggleLessonFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const { isFeatured } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID format" });
        }

        if (typeof isFeatured !== 'boolean') {
            return res.status(400).json({ success: false, message: "isFeatured must be a boolean" });
        }

        const updatedLesson = await adminService.toggleLessonFeature(id, isFeatured);

        if (!updatedLesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lesson featured status toggled successfully",
            data: updatedLesson
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const toggleLessonReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { isReviewed } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid lesson ID format" });
        }

        if (typeof isReviewed !== 'boolean') {
            return res.status(400).json({ success: false, message: "isReviewed must be a boolean" });
        }

        const updatedLesson = await adminService.toggleLessonReview(id, isReviewed);

        if (!updatedLesson) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lesson review status toggled successfully",
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

        const result = await adminService.deleteLesson(id);

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

// Analytics
const getAnalytics = async (req, res) => {
    try {
        const result = await adminService.getAnalytics();
        res.status(200).json({
            success: true,
            message: "Analytics fetched successfully",
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Reports
const getReports = async (req, res) => {
    try {
        const result = await adminService.getReports(req.query);
        res.status(200).json({
            success: true,
            message: "Reports fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid report ID format" });
        }

        const result = await adminService.deleteReport(id);

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        res.status(200).json({
            success: true,
            message: "Report deleted successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
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
