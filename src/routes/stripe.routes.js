const express = require("express");
const stripeController = require("../controllers/stripe.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/create-checkout-session", verifyToken, stripeController.createCheckoutSession);
router.post("/verify-session", verifyToken, stripeController.verifySession);

// Note: webhook is mounted separately in app.js because it requires express.raw()
// so we don't add it here.

module.exports = router;
