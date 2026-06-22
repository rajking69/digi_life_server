const express = require("express");
const { getAuth } = require("../config/betterAuth");

const jwt = require("jsonwebtoken");
const client = require("../config/mongodb");

const router = express.Router();

router.post("/jwt/sign", async (req, res) => {
    try {
        // Guard: JWT_SECRET must be configured
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET environment variable is not set!");
            return res.status(500).json({ success: false, message: "Server configuration error: JWT_SECRET not set" });
        }

        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session || !session.user) {
            // This usually means the Better Auth session cookie was not sent with the request.
            // In production, this can happen if SameSite=None is not set on the session cookie.
            console.warn("JWT sign: No valid Better Auth session found. Cookie may not have been sent cross-origin.");
            return res.status(401).json({ success: false, message: "Unauthorized. No valid Better Auth session." });
        }

        const userInDb = await client.db(process.env.DB_NAME).collection("users").findOne({ email: session.user.email });
        if (!userInDb) {
            console.warn(`JWT sign: User ${session.user.email} not found in users collection. Database hook may have failed.`);
            return res.status(401).json({ success: false, message: "User not synced to database." });
        }

        const token = jwt.sign(
            { userId: userInDb._id.toString(), email: userInDb.email, role: userInDb.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const isProduction = (process.env.BETTER_AUTH_URL || "").startsWith("https");
        res.cookie("jwt_token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ success: true, message: "JWT generated successfully" });
    } catch (error) {
        console.error("JWT Sign error:", error);
        res.status(500).json({ success: false, message: "Failed to generate JWT", error: error.message });
    }
});

router.post("/jwt/clear", (req, res) => {
    const isProduction = (process.env.BETTER_AUTH_URL || "").startsWith("https");
    res.clearCookie("jwt_token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
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
        console.error("Better Auth route error:", error);
        res.status(500).json({ success: false, message: "Better Auth route failure", error: error.message });
    }
});

module.exports = router;
