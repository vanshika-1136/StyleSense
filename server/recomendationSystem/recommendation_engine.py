import os
import sys
import json
import pandas as pd
import numpy as np
import psycopg2
from dotenv import load_dotenv


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_FILE = os.path.join(
    BASE_DIR,
    "..",
    ".env"
)

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL")

FINAL_LIMIT = 40

# We don't need to fully rank 82k products.
# Keep a reasonably large candidate pool before final ranking.
CANDIDATE_LIMIT = 500


# ============================================================
# LOAD PRODUCTS FROM NEON
# ============================================================

def load_products():

    if not DATABASE_URL:
        print(
            "DATABASE_URL not found",
            file=sys.stderr
        )
        return pd.DataFrame()

    conn = None

    try:

        print(
            "Loading products from Neon...",
            file=sys.stderr
        )

        conn = psycopg2.connect(
            DATABASE_URL,
            connect_timeout=10
        )

        query = """
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
        """

        products = pd.read_sql_query(
            query,
            conn
        )

        products.columns = (
            products.columns
            .str.strip()
        )

        products["id"] = (
            products["id"]
            .astype(str)
        )

        # Normalize matching columns ONCE
        attributes = [
            "gender",
            "category",
            "subcategory",
            "color",
            "fit",
            "style"
        ]

        for column in attributes:

            products[column] = (
                products[column]
                .fillna("")
                .astype(str)
                .str.strip()
                .str.lower()
            )

        print(
            f"Loaded {len(products)} products from Neon",
            file=sys.stderr
        )

        return products

    except Exception as e:

        print(
            f"Error loading products from Neon: {e}",
            file=sys.stderr
        )

        return pd.DataFrame()

    finally:

        if conn:
            conn.close()


PRODUCTS = load_products()


# ============================================================
# INTERACTION WEIGHTS
# ============================================================

INTERACTION_WEIGHTS = {

    "view": 1,
    "click": 2,
    "add_to_wishlist": 5,
    "add_to_cart": 7,
    "remove_from_wishlist": -4,
    "remove_from_cart": -5
}


# ============================================================
# GET USER INTERACTIONS
# ============================================================

def get_user_interactions(user_id):

    if not user_id or not DATABASE_URL:
        return pd.DataFrame()

    conn = None

    try:

        conn = psycopg2.connect(
            DATABASE_URL,
            connect_timeout=5
        )

        query = """
            SELECT
                product_id,
                interaction_type,
                timestamp,
                dwell_time_ms
            FROM interactions
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 500
        """

        df = pd.read_sql_query(
            query,
            conn,
            params=(user_id,)
        )

        if not df.empty:

            df["product_id"] = (
                df["product_id"]
                .astype(str)
            )

            df["dwell_time_ms"] = (
                pd.to_numeric(
                    df["dwell_time_ms"],
                    errors="coerce"
                )
                .fillna(0)
            )

        return df

    except Exception as e:

        print(
            f"Recommendation DB error: {e}",
            file=sys.stderr
        )

        return pd.DataFrame()

    finally:

        if conn:
            conn.close()


# ============================================================
# DWELL SCORE
# ============================================================

def dwell_score(milliseconds):

    seconds = float(milliseconds) / 1000

    if seconds < 3:
        return 0

    if seconds < 10:
        return 1

    if seconds < 30:
        return 2

    if seconds < 60:
        return 3

    return 4


# ============================================================
# BUILD USER PROFILE
# ============================================================

def build_user_profile(interactions):

    if interactions.empty:
        return {}

    attributes = [
        "gender",
        "category",
        "subcategory",
        "color",
        "fit",
        "style"
    ]

    product_attributes = PRODUCTS[
        ["id"] + attributes
    ]

    merged = interactions.merge(
        product_attributes,
        left_on="product_id",
        right_on="id",
        how="left"
    )

    merged["interaction_score"] = (
        merged["interaction_type"]
        .map(INTERACTION_WEIGHTS)
        .fillna(0)
    )

    # Vectorized dwell calculation
    seconds = (
        merged["dwell_time_ms"]
        .astype(float)
        / 1000
    )

    merged["dwell_score"] = np.select(
        [
            seconds < 3,
            seconds < 10,
            seconds < 30,
            seconds < 60
        ],
        [
            0,
            1,
            2,
            3
        ],
        default=4
    )

    merged["total_score"] = (
        merged["interaction_score"]
        +
        merged["dwell_score"]
    )

    profile = {}

    weights = {

        "gender": 1,
        "category": 5,
        "subcategory": 2,
        "color": 4,
        "style": 4,
        "fit": 2
    }

    for attribute in attributes:

        valid = merged[
            merged[attribute].notna()
            &
            (merged[attribute] != "")
        ]

        if valid.empty:
            continue

        scores = (
            valid
            .groupby(attribute)["total_score"]
            .sum()
            * weights[attribute]
        )

        profile[attribute] = (
            scores
            .sort_values(
                ascending=False
            )
            .head(10)
            .to_dict()
        )

    return profile


# ============================================================
# NORMALIZE
# ============================================================

def normalize(series):

    series = pd.to_numeric(
        series,
        errors="coerce"
    ).fillna(0)

    if series.empty:
        return series

    min_value = series.min()
    max_value = series.max()

    if max_value == min_value:

        return pd.Series(
            0.0,
            index=series.index
        )

    return (
        (series - min_value)
        /
        (max_value - min_value)
    )


# ============================================================
# VECTORIZED PERSONALIZATION
# ============================================================

def calculate_personalization(
    products,
    profile
):

    score = pd.Series(
        0.0,
        index=products.index
    )

    weights = {

        "category": 5,
        "subcategory": 2,
        "color": 4,
        "style": 4,
        "fit": 2,
        "gender": 1
    }

    for attribute, weight in weights.items():

        attribute_profile = profile.get(
            attribute,
            {}
        )

        if not attribute_profile:
            continue

        mapped_scores = (
            products[attribute]
            .map(attribute_profile)
            .fillna(0)
        )

        score += (
            mapped_scores * weight
        )

    return score


# ============================================================
# RECOMMENDATION REASON
# ============================================================

def recommendation_reason(
    product,
    profile
):

    if not profile:
        return "Popular with StyleSense shoppers"

    matches = []

    for attribute in [
        "category",
        "color",
        "style",
        "fit",
        "subcategory"
    ]:

        value = product.get(
            attribute,
            ""
        )

        if not value:
            continue

        attribute_profile = profile.get(
            attribute,
            {}
        )

        if value in attribute_profile:

            matches.append(
                (
                    attribute,
                    attribute_profile[value]
                )
            )

    if not matches:

        return (
            "Matches your recent fashion activity"
        )

    matches.sort(
        key=lambda x: x[1],
        reverse=True
    )

    attribute, _ = matches[0]

    value = str(
        product.get(
            attribute,
            ""
        )
    ).title()

    reasons = {

        "category":
            f"Because you explored {value} products",

        "color":
            f"Because you interacted with {value} products",

        "style":
            f"Because you liked the {value} style",

        "fit":
            f"Because you liked the {value} fit",

        "subcategory":
            f"Because you explored {value}"
    }

    return reasons.get(
        attribute,
        "Matches your recent fashion activity"
    )


# ============================================================
# RECOMMEND PRODUCTS
# ============================================================

def get_recommendations(
    user_id,
    limit=40
):

    interactions = get_user_interactions(
        user_id
    )

    # ========================================================
    # NEW USER
    # ========================================================

    if interactions.empty:

        if PRODUCTS.empty:
            return PRODUCTS

        # Don't copy all columns unnecessarily
        result = PRODUCTS.copy()

        if "popularity_score" in result.columns:

            result["final_score"] = normalize(
                result["popularity_score"]
            )

        elif "rating" in result.columns:

            result["final_score"] = normalize(
                result["rating"]
            )

        else:

            result["final_score"] = 0

        result = (
            result
            .nlargest(
                limit,
                "final_score"
            )
            .copy()
        )

        result["recommendation_reason"] = (
            "Popular with StyleSense shoppers"
        )

        return result.reset_index(
            drop=True
        )

    # ========================================================
    # USER PROFILE
    # ========================================================

    profile = build_user_profile(
        interactions
    )

    # ========================================================
    # REMOVE INTERACTED PRODUCTS FIRST
    # ========================================================

    interacted_products = set(
        interactions["product_id"]
        .astype(str)
    )

    available = PRODUCTS[
        ~PRODUCTS["id"].isin(
            interacted_products
        )
    ].copy()

    if available.empty:
        return available

    # ========================================================
    # VECTORIZED PERSONALIZATION
    # ========================================================

    available["personalization_score"] = (
        calculate_personalization(
            available,
            profile
        )
    )

    # ========================================================
    # CANDIDATE GENERATION
    # ========================================================

    # Get candidates based on personalization
    personalized_candidates = (
        available
        .nlargest(
            CANDIDATE_LIMIT,
            "personalization_score"
        )
    )

    # Get popular candidates
    if "popularity_score" in available.columns:

        popular_candidates = (
            available
            .nlargest(
                CANDIDATE_LIMIT,
                "popularity_score"
            )
        )

    else:

        popular_candidates = available.head(
            CANDIDATE_LIMIT
        )

    # Get highly rated candidates
    if "rating" in available.columns:

        rating_candidates = (
            available
            .nlargest(
                CANDIDATE_LIMIT,
                "rating"
            )
        )

    else:

        rating_candidates = available.head(
            CANDIDATE_LIMIT
        )

    # Combine candidate pools
    result = pd.concat(
        [
            personalized_candidates,
            popular_candidates,
            rating_candidates
        ],
        ignore_index=True
    )

    result = (
        result
        .drop_duplicates(
            subset=["id"]
        )
        .copy()
    )

    # ========================================================
    # NORMALIZATION
    # ========================================================

    result["personalization_normalized"] = (
        normalize(
            result["personalization_score"]
        )
    )

    if "popularity_score" in result.columns:

        result["popularity_normalized"] = (
            normalize(
                result["popularity_score"]
            )
        )

    else:

        result["popularity_normalized"] = 0

    if "rating" in result.columns:

        result["rating_normalized"] = (
            normalize(
                result["rating"]
            )
        )

    else:

        result["rating_normalized"] = 0

    # ========================================================
    # FINAL SCORE
    # ========================================================

    result["final_score"] = (

        result["personalization_normalized"]
        * 0.70

        +

        result["popularity_normalized"]
        * 0.20

        +

        result["rating_normalized"]
        * 0.10
    )

    # ========================================================
    # SORT FIRST
    # ========================================================

    result = (
        result
        .nlargest(
            limit,
            "final_score"
        )
        .copy()
    )

    # ========================================================
    # GENERATE REASONS ONLY FOR FINAL 40
    # ========================================================

    result["recommendation_reason"] = [
        recommendation_reason(
            row,
            profile
        )
        for _, row in result.iterrows()
    ]

    # ========================================================
    # FINAL
    # ========================================================

    return (
        result
        .reset_index(
            drop=True
        )
    )


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    try:

        input_data = sys.stdin.read()

        data = json.loads(
            input_data
        )

        user_id = data.get(
            "user_id"
        )

        limit = int(
            data.get(
                "limit",
                FINAL_LIMIT
            )
        )

        results = get_recommendations(
            user_id,
            limit
        )

        results = results.fillna("")

        print(
            json.dumps(
                {
                    "success": True,
                    "user_id": user_id,
                    "count": len(results),
                    "products":
                        results.to_dict(
                            orient="records"
                        )
                },
                default=str
            )
        )

    except Exception as e:

        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(e)
                }
            )
        )

        sys.exit(1)
