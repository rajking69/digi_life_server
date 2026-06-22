const express = require("express");
const paymentsController = require("../controllers/payments.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// User routes
router.get("/me", verifyToken, paymentsController.getMyPayments);

module.exports = router;
