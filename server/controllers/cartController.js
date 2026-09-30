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


// ============================================================
// GET CURRENT CART
// ============================================================

const getCart = async (req, res) => {

    try {

        const user_id = req.user.user_id;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: "user_id is required"
            });
        }


        // ----------------------------------------------------
        // Get latest cart state for every product
        // ----------------------------------------------------

        const query = `
            SELECT DISTINCT ON (product_id)
                product_id,
                interaction_type,
                timestamp
            FROM interactions
            WHERE user_id = $1
            AND interaction_type IN (
                'add_to_cart',
                'remove_from_cart'
            )
            ORDER BY product_id, timestamp DESC;
        `;

        const result = await pool.query(
            query,
            [user_id]
        );


        console.log(
            "CART USER:",
            user_id
        );

        console.log(
            "CART DB ROWS:",
            result.rows
        );


        // ----------------------------------------------------
        // Keep only products whose latest state is add_to_cart
        // ----------------------------------------------------

        const cartIds = result.rows
            .filter(
                row =>
                    row.interaction_type ===
                    "add_to_cart"
            )
            .map(
                row =>
                    String(row.product_id)
            );


        console.log(
            "CART PRODUCT IDS:",
            cartIds
        );


        // ----------------------------------------------------
        // Empty cart
        // ----------------------------------------------------

        if (cartIds.length === 0) {

            return res.json({
                success: true,
                count: 0,
                products: []
            });

        }


        // ----------------------------------------------------
        // Load products from CSV
        // ----------------------------------------------------

        const products = [];

        await new Promise((resolve, reject) => {

            fs.createReadStream(PRODUCT_FILE)

                .pipe(csv())

                .on("data", (row) => {

                    const csvId =
                        String(row.id);

                    if (
                        cartIds.includes(csvId)
                    ) {

                        products.push(row);

                    }

                })

                .on("end", resolve)

                .on("error", reject);

        });


        // ----------------------------------------------------
        // Return cart
        // ----------------------------------------------------

        return res.json({

            success: true,

            count: products.length,

            products

        });

    } catch (error) {

        console.error(
            "Cart error:",
            error
        );

        return res.status(500).json({

            success: false,

            error: "Failed to load cart",

            details: error.message

        });

    }

};


module.exports = {
    getCart
};