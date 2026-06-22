const verifyAdmin = async (req, res, next) => {
    try {
        // verifyToken must run before this middleware
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized access. User not authenticated." });
        }

        // Check the role stored in our 'users' collection
        if (req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden. Admin access required." });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error during authorization." });
    }
};

module.exports = verifyAdmin;
