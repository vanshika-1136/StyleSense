
const pool = require("../db/db");


// ============================================================
// RECORD INTERACTION
// ============================================================

const recordInteraction = async (req, res) => {

    try {

        const {
            
            product_id,
            session_id,
            interaction_type,
            dwell_time_ms
        } = req.body;

        const user_id = req.user.user_id;

        if (
            !user_id ||
            !product_id ||
            !session_id ||
            !interaction_type
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "user_id, product_id, session_id and interaction_type are required"
            });
        }


        const dwellTime =
            Number(dwell_time_ms) || 0;


        const query = `
            INSERT INTO interactions
            (
                user_id,
                product_id,
                session_id,
                interaction_type,
                dwell_time_ms
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;


        const values = [

            user_id,

            product_id,

            session_id,

            interaction_type,

            dwellTime
        ];


        const result =
            await pool.query(
                query,
                values
            );


        return res.status(201).json({

            success: true,

            message:
                "Interaction recorded",

            interaction:
                result.rows[0]
        });


    } catch (error) {

        console.error(
            "Interaction error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to record interaction",

            details:
                error.message
        });
    }
};


// ============================================================
// GET USER INTERACTIONS
// ============================================================

const getUserInteractions = async (req, res) => {

    try {

        const user_id = req.user.user_id;


        if (!user_id) {

            return res.status(400).json({

                success: false,

                error:
                    "user_id is required"
            });
        }


        const query = `
            SELECT
                product_id,
                interaction_type,
                timestamp
            FROM interactions
            WHERE user_id = $1
            AND interaction_type IN (
                'add_to_wishlist',
                'remove_from_wishlist',
                'add_to_cart',
                'remove_from_cart'
            )
            ORDER BY timestamp ASC;
        `;


        const result =
            await pool.query(
                query,
                [user_id]
            );


        return res.json({

            success: true,

            interactions:
                result.rows
        });


    } catch (error) {

        console.error(
            "Get interactions error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to get user interactions",

            details:
                error.message
        });
    }
};


module.exports = {

    recordInteraction,

    getUserInteractions
};

