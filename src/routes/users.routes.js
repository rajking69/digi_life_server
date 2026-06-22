const express = require("express");
const usersController = require("../controllers/users.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", usersController.createUser);
router.get("/", usersController.getAllUsers);
router.get("/top-contributors", usersController.getTopContributors);
router.get("/:email", usersController.getUserByEmail);
router.patch("/:id", verifyToken, usersController.updateUser);
router.delete("/:id", verifyToken, usersController.deleteUser);

module.exports = router;