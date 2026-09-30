const express = require("express");

const {
    recordSearch
} = require("../controllers/searchHistoryController");

const router = express.Router();

router.post(
    "/",
    recordSearch
);

module.exports = router;