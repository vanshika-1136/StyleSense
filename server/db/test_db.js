// const pool = require("./db");

// async function testConnection() {
//     try {
//         const result = await pool.query("SELECT NOW()");
//         console.log("Neon connected successfully!");
//         console.log(result.rows[0]);
//     } catch (error) {
//         console.error("Database connection failed:");
//         console.error(error);
//     } finally {
//         await pool.end();
//     }
// }

// testConnection(); 
const pool = require("./db");

async function testConnection() {
    try {
        const result = await pool.query(`
            SELECT 
                current_database(),
                current_schema(),
                current_user
        `);

        console.log(result.rows[0]);

    } catch (error) {
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testConnection();