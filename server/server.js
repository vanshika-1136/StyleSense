const express = require("express");
const cors = require("cors");

const searchRoutes = require("./routes/searchRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
// const {
//     loadProducts
// } = require("./practice/services/preferenceEngine");


const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// ROUTES
// ========================================

app.use(
    "/api/search",
    searchRoutes
);

app.use(
    "/api/interactions",
    interactionRoutes
);
app.use("/api/wishlist", wishlistRoutes);

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "StyleSense API is running"
    });

});


// ========================================
// START SERVER
// ========================================

const PORT = 5000;


const startServer = async () => {

    try {

        // await loadProducts();

        app.listen(PORT, () => {

            console.log(
                `StyleSense server running on http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

    }

};


startServer();