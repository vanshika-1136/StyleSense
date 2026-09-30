const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getWishlist,
} = require("../controllers/wishlistController");

router.get(
  "/user/:userId",
  authMiddleware,
  getWishlist
);

module.exports = router;
