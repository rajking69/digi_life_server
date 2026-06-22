const express = require("express");
const favoritesController = require("../controllers/favorites.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/", verifyToken, favoritesController.createFavorite);
router.get("/", verifyToken, favoritesController.getFavorites);
router.delete("/:id", verifyToken, favoritesController.deleteFavorite);

module.exports = router;
