const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    getCart
} = require("../controllers/cartController");

const router = express.Router();

router.get(
    "/user/:user_id",authMiddleware,
    getCart
);

module.exports = router;