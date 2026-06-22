const express = require("express");
const commentsController = require("../controllers/comments.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, commentsController.createComment);
router.get("/:lessonId", commentsController.getComments);
router.patch("/:id", verifyToken, commentsController.updateComment);
router.delete("/:id", verifyToken, commentsController.deleteComment);

module.exports = router;
