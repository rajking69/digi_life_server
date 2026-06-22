const paymentsService = require("../services/payments.service");

const getMyPayments = async (req, res) => {
    try {
        const userId = req.user._id; // Set by verifyToken middleware
        const query = req.query;
        
        const result = await paymentsService.getUserPayments(userId, query);
        res.status(200).json({
            success: true,
            message: "User payments fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error fetching user payments:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getAdminPayments = async (req, res) => {
    try {
        const query = req.query;
        
        const result = await paymentsService.getAllPayments(query);
        res.status(200).json({
            success: true,
            message: "All payments fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error fetching admin payments:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    getMyPayments,
    getAdminPayments
};
