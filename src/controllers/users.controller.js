const usersService = require("../services/users.service");
const { ObjectId } = require("mongodb");

const createUser = async (req, res) => {
    try {
        const { name, email, photoURL } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required fields."
            });
        }

        const newUser = await usersService.createUser({ name, email, photoURL });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await usersService.getAllUsers();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getTopContributors = async (req, res) => {
    try {
        const topContributors = await usersService.getTopContributors();
        res.status(200).json({
            success: true,
            message: "Top contributors fetched successfully",
            data: topContributors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await usersService.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID format" });
        }

        // Security: Ensure user is only updating their own profile
        if (req.user._id.toString() !== id) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only update your own profile" });
        }

        // Security: Prevent privilege escalation
        delete updateData.role;
        delete updateData.isPremium;

        const updatedUser = await usersService.updateUser(id, updateData);

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID format" });
        }

        // Security: Ensure user is only deleting their own profile
        if (req.user._id.toString() !== id) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own profile" });
        }

        const result = await usersService.deleteUser(id);

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getTopContributors,
    getUserByEmail,
    updateUser,
    deleteUser
};
