const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

// =====================================================
// RUN PYTHON
// =====================================================

const runPython = (
    scriptPath,
    input
) => {

    return new Promise(
        (resolve, reject) => {

            const pythonProcess = spawn(
                "python",
                [scriptPath]
            );

            let output = "";
            let errorOutput = "";


            // =========================================
            // STDOUT
            // =========================================

            pythonProcess.stdout.on(
                "data",
                (data) => {

                    output += data.toString();

                }
            );


            // =========================================
            // STDERR
            // =========================================

            pythonProcess.stderr.on(
                "data",
                (data) => {

                    errorOutput +=
                        data.toString();

                }
            );


            // =========================================
            // SEND INPUT
            // =========================================

            pythonProcess.stdin.write(
                JSON.stringify(input)
            );

            pythonProcess.stdin.end();


            // =========================================
            // COMPLETE
            // =========================================

            pythonProcess.on("close", (code) => {
                console.log("Python exit code:", code);

                if (errorOutput) {
                    console.log("Python stderr:", errorOutput);
                }

                if (code !== 0) {
                    return reject(
                        new Error(errorOutput || `Python exited with code ${code}`)
                    );
                }

                try {
                    const parsedOutput = JSON.parse(output);
                    resolve(parsedOutput);
                } catch (error) {
                    console.error("Python stdout:", output);
                    console.error("Python stderr:", errorOutput);

                    reject(new Error("Invalid JSON returned by Python"));
                }
            });


            pythonProcess.on(
                "error",
                (error) => {

                    reject(error);

                }
            );

        }
    );

};



// =====================================================
// SEARCH
// =====================================================

const searchProducts = (req, res) => {

    const {
        q,
        user_id,
    } = req.query;


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
        "search_engine.py"
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

        const PRODUCT_FILE = path.join(
            __dirname,
            "..",
            "recomendationSystem",
            "stylesense_products_clean.csv"
        );

        console.log(
            "Loading trending products from:",
            PRODUCT_FILE
        );

        const products = [];

        await new Promise((resolve, reject) => {

            fs.createReadStream(PRODUCT_FILE)

                .pipe(csv())

                .on("data", (row) => {

                    if (products.length < 20) {
                        products.push(row);
                    }

                })

                .on("end", resolve)

                .on("error", reject);

        });

        console.log(
            "Trending products loaded:",
            products.length
        );

        return res.json({

            success: true,

            count: products.length,

            products

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