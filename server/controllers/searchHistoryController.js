const pool = require("../db/db");

const recordSearch = async (req, res) => {
    try {
        const {
            user_id,
            query
        } = req.body;

        if (!user_id || !query?.trim()) {
            return res.status(400).json({
                success: false,
                error: "user_id and query are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO search_history
            (
                user_id,
                query
            )
            VALUES ($1, $2)
            RETURNING *;
            `,
            [
                user_id,
                query.trim()
            ]
        );

        return res.status(201).json({
            success: true,
            search: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Search history error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to record search",
            details: error.message
        });
    }
};

module.exports = {
    recordSearch
};