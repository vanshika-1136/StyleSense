const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const pool = require("../db/db");

const PRODUCT_FILE = path.join(
__dirname,
"..",
"recomendationSystem",
"stylesense_products_clean.csv"
);

const getWishlist = async (req, res) => {
try {
const user_id = req.user.user_id;


    if (!user_id) {
        return res.status(400).json({
            success: false,
            error: "user_id is required"
        });
    }

    // Get latest wishlist state from database
    const query = `
        SELECT DISTINCT ON (product_id)
            product_id,
            interaction_type,
            timestamp
        FROM interactions
        WHERE user_id = $1
        AND interaction_type IN (
            'add_to_wishlist',
            'remove_from_wishlist'
        )
        ORDER BY product_id, timestamp DESC;
    `;

    const result = await pool.query(query, [user_id]);
    console.log("USER ID:", user_id);
    console.log("DB ROWS:", result.rows);

    const wishlistIds = result.rows
        .filter(
            row =>
                row.interaction_type ===
                "add_to_wishlist"
        )
        .map(row => String(row.product_id));
    
        console.log("WISHLIST IDS:", wishlistIds);

    if (wishlistIds.length === 0) {
        return res.json({
            success: true,
            count: 0,
            products: []
        });
    }
    
    

    // Read product CSV
    const products = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(PRODUCT_FILE)
            .pipe(csv())
            .on("data", (row) => {

                const csvId = String(row.id);

                if (
                    wishlistIds.includes(
                        String(row.id)
                    )
                ) {

                     console.log("CSV MATCH:", csvId);
                    products.push(row);
                }
            })
            .on("end", resolve)
            .on("error", reject);
    });
    

    return res.json({
        success: true,
        count: products.length,
        products
    });

} catch (error) {
    console.error(
        "Wishlist error:",
        error
    );

    return res.status(500).json({
        success: false,
        error: "Failed to load wishlist",
        details: error.message
    });
}

};

module.exports = {
getWishlist
};
