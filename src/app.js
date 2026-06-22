const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const usersRoutes = require("./routes/users.routes");
const lessonsRoutes = require("./routes/lessons.routes");
const favoritesRoutes = require("./routes/favorites.routes");
const commentsRoutes = require("./routes/comments.routes");
const reportsRoutes = require("./routes/reports.routes");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const stripeRoutes = require("./routes/stripe.routes");
const paymentsRoutes = require("./routes/payments.routes");
const stripeController = require("./controllers/stripe.controller");
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN,
        credentials: true,
    })
);

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeController.webhook);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("🚀 Digi Life Server Running...");
});

// Auth Route (Better Auth)
app.use("/api/auth", authRoutes);

// Users Route
app.use("/api/users", usersRoutes);

// Lessons Route
app.use("/api/lessons", lessonsRoutes);

// Favorites Route
app.use("/api/favorites", favoritesRoutes);

// Comments Route
app.use("/api/comments", commentsRoutes);

// Reports Route
app.use("/api/reports", reportsRoutes);

// Admin Route
app.use("/api/admin", adminRoutes);

// Stripe Route
app.use("/api/stripe", stripeRoutes);

// Payments Route
app.use("/api/payments", paymentsRoutes);

module.exports = app;