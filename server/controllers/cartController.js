
const pool = require("../db/db");




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
            Number(row.product_id)
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

const productQuery = `
    SELECT
        id,
        name,
        image_url,
        price,
        mrp,
        rating,
        "ratingTotal",
        discount,
        calculated_discount,
        popularity_score,
        seller,
        gender,
        category,
        subcategory,
        color,
        fit,
        style,
        purl
    FROM products
    WHERE id = ANY($1::bigint[]);
`;

const productResult = await pool.query(
    productQuery,
    [cartIds]
);

const products = productResult.rows;


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