const { spawn } = require("child_process");
const path = require("path");


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

const searchProducts = async (
    req,
    res
) => {

    try {

        const query =
            req.query.q;

        const userId =
            req.query.user_id ||
            null;


        // =========================================
        // VALIDATION
        // =========================================

        if (
            !query ||
            !query.trim()
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Search query is required"

            });

        }


        console.log(
            `Searching for: ${query}`
        );

        console.log(
            `User: ${userId || "guest"}`
        );


        // =========================================
        // PYTHON PATH
        // =========================================

        const pythonScript =
            path.join(

                __dirname,

                "..",

                "recomendationSystem",

                "combined_engine.py"

            );


        console.log(
            "Python:",
            pythonScript
        );


        // =========================================
        // RUN PYTHON
        // =========================================

        const result =
            await runPython(

                pythonScript,

                {

                    query: query,

                    user_id: userId,

                    limit: 20

                }

            );


        // =========================================
        // PYTHON FAILURE
        // =========================================

        if (!result.success) {

            return res.status(500).json({

                success: false,

                error:
                    result.error ||
                    "Python recommendation engine failed"

            });

        }


        // =========================================
        // RESPONSE
        // =========================================

        return res.json({

            success: true,

            query:
                result.query,

            user_id:
                result.user_id,

            count:
                result.count,

            products:
                result.products

        });

    }

    catch (error) {

        console.error(
            "Search controller error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Search failed",

            details:
                error.message

        });

    }

};


module.exports = {
    searchProducts
};