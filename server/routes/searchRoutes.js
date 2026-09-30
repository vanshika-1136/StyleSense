const express = require("express");

const {
    searchProducts,
    getTrendingProducts
} = require("../controllers/searchController");

const router = express.Router();

router.get("/", searchProducts);
router.get("/trending", getTrendingProducts);
module.exports = router;