const express = require("express");
const lessonsController = require("../controllers/lessons.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, lessonsController.createLesson);
router.get("/", lessonsController.getLessons);
router.get("/:id", lessonsController.getLessonById);
router.patch("/:id", verifyToken, lessonsController.updateLesson);
router.delete("/:id", verifyToken, lessonsController.deleteLesson);

module.exports = router;
