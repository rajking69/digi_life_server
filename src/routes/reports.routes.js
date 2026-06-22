const express = require("express");
const reportsController = require("../controllers/reports.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, reportsController.createReport);
router.get("/", verifyToken, reportsController.getReports); // It's good practice for this to be protected
router.delete("/:id", verifyToken, reportsController.deleteReport);

module.exports = router;
