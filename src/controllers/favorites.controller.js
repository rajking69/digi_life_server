const favoritesService = require("../services/favorites.service");
const { ObjectId } = require("mongodb");

const createFavorite = async (req, res) => {
    try {
        const { lessonId } = req.body;
        const userId = req.user._id.toString();

        if (!lessonId) {
            return res.status(400).json({
                success: false,
                message: "lessonId is required."
            });
        }

        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const newFavorite = await favoritesService.createFavorite(userId, lessonId);
        res.status(201).json({
            success: true,
            message: "Added to favorites successfully",
            data: newFavorite
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getFavorites = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const result = await favoritesService.getFavoritesByUserId(userId, req.query);
        res.status(200).json({
            success: true,
            message: "Favorites fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid favorite ID format" });
        }

        await favoritesService.deleteFavorite(id);

        res.status(200).json({
            success: true,
            message: "Removed from favorites successfully",
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
    createFavorite,
    getFavorites,
    deleteFavorite
};
