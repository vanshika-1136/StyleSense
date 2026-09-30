const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/db");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT user_id FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: "User with this email already exists"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `
            INSERT INTO users
            (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING user_id, name, email, created_at
            `,
            [name.trim(), normalizedEmail, passwordHash]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            error: "Registration failed"
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const result = await pool.query(
            `
            SELECT user_id, name, email, password_hash, created_at
            FROM users
            WHERE email = $1
            `,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Never send password hash to frontend
        delete user.password_hash;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            error: "Login failed"
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT user_id, name, email, created_at
            FROM users
            WHERE user_id = $1
            `,
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to get current user"
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};