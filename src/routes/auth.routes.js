const express = require("express");
const { getAuth } = require("../config/betterAuth");

const jwt = require("jsonwebtoken");
const client = require("../config/mongodb");

const router = express.Router();

router.post("/jwt/sign", async (req, res) => {
    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) {
            return res.status(401).json({ success: false, message: "Unauthorized. No valid Better Auth session." });
        }

        const userInDb = await client.db(process.env.DB_NAME).collection("users").findOne({ email: session.user.email });
        if (!userInDb) {
            return res.status(401).json({ success: false, message: "User not synced." });
        }

        const token = jwt.sign(
            { userId: userInDb._id.toString(), email: userInDb.email, role: userInDb.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("jwt_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ success: true, message: "JWT generated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to generate JWT" });
    }
});

router.post("/jwt/clear", (req, res) => {
    res.clearCookie("jwt_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    });
    res.status(200).json({ success: true, message: "JWT cleared successfully" });
});

router.all("/*path", async (req, res, next) => {
    try {
        const auth = await getAuth();
        const { toNodeHandler } = await import("better-auth/node");
        return toNodeHandler(auth)(req, res);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
