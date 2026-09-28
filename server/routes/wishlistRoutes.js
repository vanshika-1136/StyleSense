const express = require("express");

const {
getWishlist
} = require("../controllers/wishlistController");

const router = express.Router();

router.get(
"/user/:user_id",
getWishlist
);

module.exports = router;
