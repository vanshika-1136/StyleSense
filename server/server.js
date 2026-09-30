const express = require("express");
const cors = require("cors");

const searchRoutes = require("./routes/searchRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const recommendationRoutes =
    require("./routes/recommendationRoutes");
    const searchHistoryRoutes =
    require("./routes/searchHistoryRoutes");
    const authRoutes = require("./routes/authRoutes");



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
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "StyleSense API is running"
    });

});
app.use(
    "/api/recommendations",
    recommendationRoutes
);
app.use(
    "/api/search-history",
    searchHistoryRoutes
);

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;


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