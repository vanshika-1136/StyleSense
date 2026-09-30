const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    getRecommendations
} = require("../controllers/recommendationController");

const router = express.Router();

router.get(
    "/:user_id",
    authMiddleware,
    getRecommendations
);

module.exports = router;