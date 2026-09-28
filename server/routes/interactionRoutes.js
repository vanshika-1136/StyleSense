const express = require("express");

const {
    recordInteraction,getUserInteractions
} = require("../controllers/interactionController");

const router = express.Router();

router.get(
    "/user/:user_id",
    getUserInteractions
);
router.post(
    "/",
    recordInteraction
);


module.exports =router;