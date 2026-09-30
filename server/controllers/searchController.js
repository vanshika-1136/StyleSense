const { spawn } = require("child_process");
const path = require("path");
const pool = require("../db/db");


// =====================================================
// SEARCH
// =====================================================

const searchProducts = (req, res) => {
const {
    q,
    user_id,
    gender,
    category,
    subcategory,
    color,
    fit,
    style,
    min_price,
    max_price,
    min_rating,
    min_discount
} = req.query;

const filters = {
    gender,
    category,
    subcategory,
    color,
    fit,
    style,
    min_price: min_price
        ? Number(min_price)
        : undefined,
    max_price: max_price
        ? Number(max_price)
        : undefined,
    min_rating: min_rating
        ? Number(min_rating)
        : undefined,
    min_discount: min_discount
        ? Number(min_discount)
        : undefined
};

    // ============================================
    // VALIDATE SEARCH
    // ============================================

    if (!q || !q.trim()) {

        return res.status(400).json({
            success: false,
            error: "Search query is required"
        });

    }


    // ============================================
    // LOG REQUEST
    // ============================================

    console.log("================================");
    console.log("Search request");

    console.log("Query:", q);
    console.log("User:", user_id);




    // ============================================
    // PYTHON SEARCH ENGINE
    // ============================================

    const pythonScript = path.join(
        __dirname,
        "..",
        "recomendationSystem",
        "combined_engine.py"
    );

    console.log(
        "Python search:",
        pythonScript
    );


   


    // ============================================
    // RUN PYTHON
    // ============================================

    const pythonProcess = spawn(
        "python",
        [pythonScript]
    );

    let output = "";
    let errorOutput = "";


    // ============================================
    // PYTHON STDOUT
    // ============================================

    pythonProcess.stdout.on(
        "data",
        (data) => {

            output += data.toString();

        }
    );


    // ============================================
    // PYTHON STDERR
    // ============================================

    pythonProcess.stderr.on(
        "data",
        (data) => {

            errorOutput +=
                data.toString();

        }
    );


    // ============================================
    // SEND DATA TO PYTHON
    // ============================================

    pythonProcess.stdin.write(
        JSON.stringify({

            query: q,

            user_id:
                user_id || null,
            filters
        })
    );

    pythonProcess.stdin.end();


    // ============================================
    // PYTHON FINISHED
    // ============================================

    pythonProcess.on(
        "close",
        (code) => {

            console.log(
                "Python exit code:",
                code
            );


            if (errorOutput) {

                console.log(
                    "Python logs:",
                    errorOutput
                );

            }


            // ====================================
            // PYTHON ERROR
            // ====================================

            if (code !== 0) {

                return res.status(500).json({

                    success: false,

                    error:
                        errorOutput ||
                        "Search engine failed"

                });

            }


            // ====================================
            // PARSE PYTHON RESPONSE
            // ====================================

            try {

                const result =
                    JSON.parse(output);

                return res.json(result);

            } catch (error) {

                console.error(
                    "Python output:",
                    output
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Invalid response from search engine"

                });

            }

        }
    );


    // ============================================
    // PYTHON PROCESS ERROR
    // ============================================

    pythonProcess.on(
        "error",
        (error) => {

            console.error(
                "Python process error:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to start search engine"

            });

        }
    );

};


const getTrendingProducts = async (req, res) => {

    try {

        const query = `
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
            ORDER BY popularity_score DESC NULLS LAST
            LIMIT 20;
        `;

        const result = await pool.query(query);

        return res.json({

            success: true,

            count: result.rows.length,

            products: result.rows

        });

    } catch (error) {

        console.error(
            "Trending products error:",
            error
        );

        return res.status(500).json({

            success: false,

            error: "Failed to load trending products",

            details: error.message

        });

    }

};

module.exports = {
    searchProducts,
    getTrendingProducts
};