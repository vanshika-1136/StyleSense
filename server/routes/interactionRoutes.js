const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    recordInteraction,getUserInteractions
} = require("../controllers/interactionController");

const router = express.Router();

router.get(
    "/user/:user_id",
     authMiddleware,
    getUserInteractions
);
router.post("/", authMiddleware, recordInteraction);


module.exports =router;