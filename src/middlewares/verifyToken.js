const jwt = require("jsonwebtoken");
const client = require("../config/mongodb");
const { ObjectId } = require("mongodb");

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt_token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized access. No JWT token found." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userInDb = await client.db(process.env.DB_NAME).collection("users").findOne({ _id: new ObjectId(decoded.userId) });
        
        if (!userInDb) {
             return res.status(401).json({ success: false, message: "Unauthorized. User not found." });
        }

        req.user = userInDb;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized. JWT has expired." });
        }
        return res.status(401).json({ success: false, message: "Unauthorized. Invalid JWT.", error: error.message });
    }
};

module.exports = verifyToken;
