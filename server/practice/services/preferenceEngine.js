const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const pool = require("../../db/db");

const CSV_FILE = path.join(
    __dirname,
    "..",
    "recomendationSystem",
    "stylesense_products_clean.csv"
);

const INTERACTION_WEIGHTS = {
    view: 1,
    click: 2,
    add_to_wishlist: 5,
    add_to_cart: 7,
    remove_from_wishlist: -4,
    remove_from_cart: -5
};

// Load products once when server starts
let products = new Map();

const loadProducts = () => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on("data", (product) => {
                products.set(String(product.id), product);
            })
            .on("end", () => {
                console.log(
                    `Preference engine loaded ${products.size} products`
                );
                resolve();
            })
            .on("error", reject);
    });
};


const updateUserPreferences = async (
    userId,
    productId,
    interactionType
) => {

    const weight = INTERACTION_WEIGHTS[interactionType];

    if (!weight) {
        console.log(
            `Unknown interaction type: ${interactionType}`
        );
        return;
    }

    const product = products.get(String(productId));

    if (!product) {
        console.log(
            `Product ${productId} not found`
        );
        return;
    }

    // Product attributes that influence preferences
    const attributes = [
        {
        type: "gender",
        value: product.gender
        },
         {
            type: "category",
            value: product.category
        },
        {
            type: "subcategory",
            value: product.subcategory
        },
        {
            type: "color",
            value: product.color
        },
        {
            type: "fit",
            value: product.fit
        },
        {
            type: "style",
            value: product.style
        }
    ];

    for (const attribute of attributes) {

        if (
            !attribute.value ||
            attribute.value === "-" ||
            attribute.value === "nan" ||
            attribute.value === "unknown"
        ) {
            continue;
        }

        const value = attribute.value
            .toString()
            .trim()
            .toLowerCase();

        if (!value) continue;

        await pool.query(
            `
            INSERT INTO user_preferences
            (
                user_id,
                preference_type,
                preference_value,
                score,
                updated_at
            )
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)

            ON CONFLICT (
                user_id,
                preference_type,
                preference_value
            )

            DO UPDATE SET
                score = user_preferences.score + EXCLUDED.score,
                updated_at = CURRENT_TIMESTAMP;
            `,
            [
                userId,
                attribute.type,
                value,
                weight
            ]
        );
    }

    console.log(
        `Preferences updated for ${userId}`
    );
};

const getUserPreferenceScore = async (
    userId,
    product
) => {
    try {
        const result = await pool.query(
            `
            SELECT
                preference_type,
                preference_value,
                score
            FROM user_preferences
            WHERE user_id = $1
            `,
            [userId]
        );

        let preferenceScore = 0;

        for (const preference of result.rows) {

            const productValue = (
                product[preference.preference_type] || ""
            )
                .toString()
                .trim()
                .toLowerCase();

            const preferredValue =
                preference.preference_value
                    .trim()
                    .toLowerCase();

            if (
                productValue &&
                productValue === preferredValue
            ) {
                preferenceScore +=
                    Number(preference.score);
            }
        }

        return preferenceScore;

    } catch (error) {

        console.error(
            "Preference scoring error:",
            error
        );

        return 0;
    }
};

const getUserPreferences = async (userId) => {

    try {

        const result = await pool.query(
            `
            SELECT
                preference_type,
                preference_value,
                score
            FROM user_preferences
            WHERE user_id = $1
            `,
            [userId]
        );

        const preferences = {};

        for (const row of result.rows) {

            if (!preferences[row.preference_type]) {
                preferences[row.preference_type] = {};
            }

            preferences[row.preference_type][
                row.preference_value
            ] = Number(row.score);
        }

        return preferences;

    } catch (error) {

        console.error(
            "Get user preferences error:",
            error
        );

        return {};
    }
};

module.exports = {
    loadProducts,
    updateUserPreferences,
    getUserPreferenceScore,
    getUserPreferences
};