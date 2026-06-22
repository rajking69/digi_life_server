const express = require("express");
const adminController = require("../controllers/admin.controller");
const paymentsController = require("../controllers/payments.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

const router = express.Router();

// All admin routes must be protected with verifyToken and verifyAdmin
router.use(verifyToken, verifyAdmin);

// Users
router.get("/users", adminController.getUsers);
router.patch("/users/:id/role", adminController.updateUserRole);

// Lessons
router.get("/lessons", adminController.getLessons);
router.patch("/lessons/:id/feature", adminController.toggleLessonFeature);
router.patch("/lessons/:id/review", adminController.toggleLessonReview);
router.delete("/lessons/:id", adminController.deleteLesson);

// Reports
router.get("/reports", adminController.getReports);
router.delete("/reports/:id", adminController.deleteReport);

// Analytics
router.get("/analytics", adminController.getAnalytics);

// Payments
router.get("/payments", paymentsController.getAdminPayments);

module.exports = router;
