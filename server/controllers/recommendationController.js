
const { spawn } = require("child_process");
const path = require("path");

const runPythonRecommendation = (
    pythonScript,
    input
) => {

    return new Promise((resolve, reject) => {

        const pythonProcess = spawn(
            "python",
            [pythonScript]
        );

        let output = "";
        let errorOutput = "";

        // Python stdout
        pythonProcess.stdout.on(
            "data",
            (data) => {
                output += data.toString();
            }
        );

        // Python stderr
        pythonProcess.stderr.on(
            "data",
            (data) => {
                errorOutput += data.toString();
            }
        );

        // Send JSON to Python
        pythonProcess.stdin.write(
            JSON.stringify(input)
        );

        pythonProcess.stdin.end();

        // Python finished
        pythonProcess.on(
            "close",
            (code) => {

                console.log(
                    "Recommendation Python exit code:",
                    code
                );

                if (errorOutput) {

                    console.log(
                        "Recommendation Python logs:",
                        errorOutput
                    );
                }

                if (code !== 0) {

                    return reject(
                        new Error(
                            errorOutput ||
                            `Python exited with code ${code}`
                        )
                    );
                }

                try {

                    const result = JSON.parse(
                        output
                    );

                    resolve(result);

                } catch (error) {

                    console.error(
                        "Python output:",
                        output
                    );

                    reject(
                        new Error(
                            "Invalid JSON returned by recommendation engine"
                        )
                    );
                }
            }
        );

        pythonProcess.on(
            "error",
            (error) => {

                reject(error);

            }
        );
    });
};


// ============================================================
// GET PERSONALIZED RECOMMENDATIONS
// ============================================================

const getRecommendations = async (
    req,
    res
) => {

    try {

        const user_id = req.user.user_id;

        // ----------------------------------------------------
        // Validate user
        // ----------------------------------------------------

        if (!user_id) {

            return res.status(400).json({

                success: false,

                error:
                    "user_id is required"

            });
        }


        console.log(
            "================================"
        );

        console.log(
            "Recommendation request"
        );

        console.log(
            "User:",
            user_id
        );


        // ----------------------------------------------------
        // Python file
        // ----------------------------------------------------

        const pythonScript = path.join(

            __dirname,

            "..",

            "recomendationSystem",

            "recommendation_engine.py"

        );


        console.log(
            "Recommendation Python:",
            pythonScript
        );


        // ----------------------------------------------------
        // Run Python
        // ----------------------------------------------------

        const result =
            await runPythonRecommendation(

                pythonScript,

                {
                    user_id,

                    limit: 40
                }

            );


        // ----------------------------------------------------
        // Python error
        // ----------------------------------------------------

        if (!result.success) {

            return res.status(500).json({

                success: false,

                error:
                    result.error ||
                    "Recommendation engine failed"

            });
        }


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        return res.json({

            success: true,

            user_id:
                result.user_id,

            count:
                result.count,

            products:
                result.products

        });

    } catch (error) {

        console.error(
            "Recommendation controller error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "Failed to generate recommendations",

            details:
                error.message

        });
    }
};


module.exports = {

    getRecommendations

};
