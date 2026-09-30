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

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PRODUCT_FILE = os.path.join(
    BASE_DIR,
    "stylesense_products_clean.csv"
)

ENV_FILE = os.path.join(
    BASE_DIR,
    "..",
    ".env"
)

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL")

FINAL_LIMIT = 40


# ============================================================
# LOAD PRODUCTS
# ============================================================

PRODUCTS = pd.read_csv(
    PRODUCT_FILE,
    low_memory=False
)

PRODUCTS.columns = PRODUCTS.columns.str.strip()

PRODUCTS["id"] = (
    PRODUCTS["id"]
    .astype(str)
)


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

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                product_id,
                interaction_type,
                timestamp,
                dwell_time_ms
            FROM interactions
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 500
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        columns = [
            "product_id",
            "interaction_type",
            "timestamp",
            "dwell_time_ms"
        ]

        df = pd.DataFrame(
            rows,
            columns=columns
        )

        cursor.close()

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
    ].copy()

    merged = interactions.merge(
        product_attributes,
        left_on="product_id",
        right_on="id",
        how="left"
    )

    # Interaction strength

    merged["interaction_score"] = (
        merged["interaction_type"]
        .map(INTERACTION_WEIGHTS)
        .fillna(0)
    )

    # Dwell strength

    merged["dwell_score"] = (
        merged["dwell_time_ms"]
        .apply(dwell_score)
    )

    merged["total_score"] = (
        merged["interaction_score"]
        +
        merged["dwell_score"]
    )

    profile = {}

    # Different importance for attributes

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
            (
                merged[attribute]
                .astype(str)
                .str.strip()
                != ""
            )
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
            .to_dict()
        )

    return profile


# ============================================================
# PERSONALIZATION SCORE
# ============================================================

def calculate_score(product, profile):

    if not profile:
        return 0

    score = 0

    weights = {

        "category": 5,

        "subcategory": 2,

        "color": 4,

        "style": 4,

        "fit": 2,

        "gender": 1
    }

    for attribute, weight in weights.items():

        value = product.get(
            attribute,
            ""
        )

        if pd.isna(value):
            continue

        value = str(value).strip()

        if not value:
            continue

        attribute_profile = profile.get(
            attribute,
            {}
        )

        if value in attribute_profile:

            score += (
                attribute_profile[value]
                * weight
            )

    return score


# ============================================================
# NORMALIZE
# ============================================================

def normalize(series):

    series = pd.to_numeric(
        series,
        errors="coerce"
    ).fillna(0)

    if len(series) == 0:
        return series

    min_value = series.min()
    max_value = series.max()

    if max_value == min_value:

        return pd.Series(
            np.zeros(len(series)),
            index=series.index
        )

    return (
        (series - min_value)
        /
        (max_value - min_value)
    )


# ============================================================
# GENERATE REASON
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

        if pd.isna(value):
            continue

        value = str(value).strip()

        if not value:
            continue

        attribute_profile = profile.get(
            attribute,
            {}
        )

        if value in attribute_profile:

            if attribute_profile[value] > 0:

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
        product.get(attribute, "")
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

        result = PRODUCTS.copy()

        # Popularity fallback

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

        result["recommendation_reason"] = (
            "Popular with StyleSense shoppers"
        )

        return (
            result
            .sort_values(
                "final_score",
                ascending=False
            )
            .head(limit)
        )

    # ========================================================
    # USER PROFILE
    # ========================================================

    profile = build_user_profile(
        interactions
    )

    # ========================================================
    # SCORE PRODUCTS
    # ========================================================

    result = PRODUCTS.copy()

    result["personalization_score"] = (
        result.apply(
            lambda row:
                calculate_score(
                    row,
                    profile
                ),
            axis=1
        )
    )

    # ========================================================
    # REMOVE ALREADY INTERACTED PRODUCTS
    # ========================================================

    interacted_products = set(
        interactions["product_id"]
        .astype(str)
    )

    result = result[
        ~result["id"].isin(
            interacted_products
        )
    ].copy()

    # ========================================================
    # POPULARITY
    # ========================================================

    if "popularity_score" in result.columns:

        result["popularity_normalized"] = (
            normalize(
                result["popularity_score"]
            )
        )

    else:

        result["popularity_normalized"] = 0

    # ========================================================
    # RATING
    # ========================================================

    if "rating" in result.columns:

        result["rating_normalized"] = (
            normalize(
                result["rating"]
            )
        )

    else:

        result["rating_normalized"] = 0

    # ========================================================
    # PERSONALIZATION
    # ========================================================

    result["personalization_normalized"] = (
        normalize(
            result["personalization_score"]
        )
    )

    # ========================================================
    # FINAL SCORE
    # ========================================================

    result["final_score"] = (

        result[
            "personalization_normalized"
        ] * 0.70

        +

        result[
            "popularity_normalized"
        ] * 0.20

        +

        result[
            "rating_normalized"
        ] * 0.10
    )

    # ========================================================
    # RECOMMENDATION REASON
    # ========================================================

    result["recommendation_reason"] = (
        result.apply(
            lambda row:
                recommendation_reason(
                    row,
                    profile
                ),
            axis=1
        )
    )

    # ========================================================
    # FINAL
    # ========================================================

    return (
        result
        .sort_values(
            "final_score",
            ascending=False
        )
        .head(limit)
        .reset_index(drop=True)
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