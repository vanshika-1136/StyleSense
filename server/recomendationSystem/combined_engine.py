
import pandas as pd
import numpy as np
import psycopg2
import os
import sys
import json

from dotenv import load_dotenv
from functools import lru_cache

from search_engine import search_products


# ============================================================
# PATHS / CONFIG
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_FILE = os.path.join(
    BASE_DIR,
    "..",
    ".env"
)

load_dotenv(ENV_FILE)

PRODUCT_FILE = os.path.join(
    BASE_DIR,
    "stylesense_products_clean.csv"
)

INTERACTION_FILE = os.path.join(
    BASE_DIR,
    "stylesense_interactions_clean.csv"
)

DATABASE_URL = os.getenv("DATABASE_URL")

CANDIDATE_LIMIT = 50
FINAL_LIMIT = 20


# ============================================================
# LOAD STATIC DATA ONCE
# ============================================================

print(
    "Loading product dataset...",
    file=sys.stderr
)

PRODUCTS_DF = pd.read_csv(
    PRODUCT_FILE,
    low_memory=False
)

PRODUCTS_DF["id"] = (
    PRODUCTS_DF["id"]
    .astype(str)
)

print(
    f"Loaded {len(PRODUCTS_DF)} products",
    file=sys.stderr
)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_score(series):

    series = pd.to_numeric(
        series,
        errors="coerce"
    ).fillna(0)

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
# USER INTERACTIONS
# ============================================================

def get_user_interactions(user_id):

    if not user_id:
        return pd.DataFrame()

    if not DATABASE_URL:

        print(
            "DATABASE_URL not found",
            file=sys.stderr
        )

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
                user_id,
                product_id,
                session_id,
                interaction_type,
                timestamp,
                dwell_time_ms
            FROM interactions
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 100
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        columns = [
            "user_id",
            "product_id",
            "session_id",
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
            f"Error loading user interactions: {e}",
            file=sys.stderr
        )

        return pd.DataFrame()

    finally:

        if conn:
            conn.close()


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
# DWELL TIME SCORE
# ============================================================

def dwell_score(milliseconds):

    try:
        seconds = float(milliseconds) / 1000

    except Exception:
        return 0

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

    profile = {

        "gender": {},
        "category": {},
        "subcategory": {},
        "color": {},
        "fit": {},
        "style": {}
    }


    # --------------------------------------------------------
    # Merge interaction history with product attributes
    # --------------------------------------------------------

    product_attributes = PRODUCTS_DF[
        [
            "id",
            "gender",
            "category",
            "subcategory",
            "color",
            "fit",
            "style"
        ]
    ].copy()

    product_attributes["id"] = (
        product_attributes["id"]
        .astype(str)
    )


    interactions = interactions.copy()

    interactions["product_id"] = (
        interactions["product_id"]
        .astype(str)
    )


    merged = interactions.merge(

        product_attributes,

        left_on="product_id",

        right_on="id",

        how="left"
    )


    # --------------------------------------------------------
    # Calculate interaction strength
    # --------------------------------------------------------

    merged["interaction_score"] = (
        merged["interaction_type"]
        .map(INTERACTION_WEIGHTS)
        .fillna(0)
    )


    merged["dwell_score"] = (
        merged["dwell_time_ms"]
        .apply(dwell_score)
    )


    merged["total_score"] = (
        merged["interaction_score"]
        +
        merged["dwell_score"]
    )


    # --------------------------------------------------------
    # Add attribute preferences
    # --------------------------------------------------------

    attributes = [

        ("gender", 1),

        ("category", 5),

        ("subcategory", 2),

        ("color", 4),

        ("style", 4),

        ("fit", 2)
    ]


    for attribute, weight in attributes:

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
            * weight
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

def calculate_personalization_score(
    product,
    profile
):

    if not profile:
        return 0


    score = 0


    attributes = [

        ("category", 5),

        ("subcategory", 2),

        ("color", 4),

        ("style", 4),

        ("fit", 2),

        ("gender", 1)
    ]


    for attribute, weight in attributes:

        if attribute not in product:
            continue

        value = product[attribute]

        if pd.isna(value):
            continue

        value = str(value).strip().lower()

        if not value:
            continue


        attribute_profile = profile.get(
            attribute,
            {}
        )


        for profile_value, profile_score in (
            attribute_profile.items()
        ):

            if (
                str(profile_value)
                .strip()
                .lower()
                == value
            ):

                score += (
                    profile_score
                    * weight
                )

                break


    return score


# ============================================================
# RECOMMENDATION REASON
# ============================================================

def generate_recommendation_reason(
    product,
    profile
):

    if not profile:

        return (
            "Popular with StyleSense shoppers"
        )


    matches = []


    attributes = [

        ("category", 5),

        ("subcategory", 2),

        ("color", 4),

        ("style", 4),

        ("fit", 2),

        ("gender", 1)
    ]


    for attribute, weight in attributes:

        if attribute not in product:
            continue

        value = product[attribute]

        if pd.isna(value):
            continue

        value = str(value).strip().lower()

        if not value:
            continue


        attribute_profile = profile.get(
            attribute,
            {}
        )


        if value in attribute_profile:

            profile_score = (
                attribute_profile[value]
            )

            if profile_score > 0:

                matches.append({

                    "attribute": attribute,

                    "value": value,

                    "score":
                        profile_score * weight
                })


    if not matches:

        return (
            "Matches your recent fashion activity"
        )


    matches.sort(
        key=lambda x: x["score"],
        reverse=True
    )


    best = matches[0]


    display_value = (
        str(best["value"])
        .replace("_", " ")
        .title()
    )


    phrases = {

        "category":
            f"Because you liked {display_value} products",

        "subcategory":
            f"Because you explored {display_value}",

        "color":
            f"Because you interacted with {display_value} products",

        "style":
            f"Because you liked the {display_value} style",

        "fit":
            f"Because you liked the {display_value} fit",

        "gender":
            f"Based on your recent {display_value} preferences"
    }


    return phrases.get(

        best["attribute"],

        "Matches your recent fashion activity"
    )


# ============================================================
# POPULARITY
# ============================================================

@lru_cache(maxsize=1)
def calculate_csv_popularity():

    print(
        "Calculating popularity...",
        file=sys.stderr
    )


    if not os.path.exists(
        INTERACTION_FILE
    ):

        return pd.DataFrame(
            columns=[
                "product_id",
                "popularity_score"
            ]
        )


    interactions = pd.read_csv(
        INTERACTION_FILE,
        low_memory=False
    )


    if interactions.empty:

        return pd.DataFrame(
            columns=[
                "product_id",
                "popularity_score"
            ]
        )


    interactions["product_id"] = (
        interactions["product_id"]
        .astype(str)
    )


    interactions["interaction_score"] = (
        interactions["interaction_type"]
        .map(INTERACTION_WEIGHTS)
        .fillna(0)
    )


    popularity = (

        interactions
        .groupby("product_id")
        ["interaction_score"]
        .sum()
        .reset_index()
    )


    popularity.columns = [

        "product_id",

        "popularity_score"
    ]


    return popularity


# ============================================================
# ADD POPULARITY
# ============================================================

def add_popularity_score(result):

    result = result.copy()


    popularity = (
        calculate_csv_popularity()
    )


    if popularity.empty:

        result["popularity_score"] = 0.0

        return result


    if "popularity_score" in result.columns:

        result = result.drop(
            columns=["popularity_score"]
        )


    if "product_id" in result.columns:

        result = result.drop(
            columns=["product_id"]
        )


    result["id"] = (
        result["id"]
        .astype(str)
    )


    result = result.merge(

        popularity,

        left_on="id",

        right_on="product_id",

        how="left"
    )


    result["popularity_score"] = (

        pd.to_numeric(

            result["popularity_score"],

            errors="coerce"
        )
        .fillna(0)
    )


    result["popularity_score"] = (
        normalize_score(
            result["popularity_score"]
        )
    )


    if "product_id" in result.columns:

        result.drop(
            columns=["product_id"],
            inplace=True
        )


    return result


# ============================================================
# RATING SCORE
# ============================================================

def add_rating_score(result):

    result = result.copy()


    if "rating" not in result.columns:

        result["rating_score"] = 0.0

        return result


    result["rating_score"] = (

        pd.to_numeric(

            result["rating"],

            errors="coerce"
        )
        .fillna(0)
    )


    result["rating_score"] = (
        normalize_score(
            result["rating_score"]
        )
    )


    return result


# ============================================================
# MAIN COMBINED SEARCH
# ============================================================

def combined_search(
    query,
    user_id=None,
    limit=20
):

    print(
        f"Search query: {query}",
        file=sys.stderr
    )


    # ========================================================
    # STEP 1
    # SEARCH
    # ========================================================

    search_result = search_products(
        query
    )


    if search_result is None:

        return pd.DataFrame()


    if isinstance(
        search_result,
        list
    ):

        result = pd.DataFrame(
            search_result
        )

    else:

        result = search_result.copy()


    if result.empty:

        return result


    print(
        f"Search returned {len(result)} candidates",
        file=sys.stderr
    )


    # ========================================================
    # STEP 2
    # ONLY PERSONALIZE TOP 50
    # ========================================================

    result = result.head(
        CANDIDATE_LIMIT
    ).copy()


    # ========================================================
    # STEP 3
    # USER HISTORY
    # ========================================================

    interactions = (
        get_user_interactions(
            user_id
        )
    )


    has_history = (
        not interactions.empty
    )


    print(
        f"User history: {len(interactions)} interactions",
        file=sys.stderr
    )


    # ========================================================
    # STEP 4
    # PERSONALIZATION
    # ========================================================

    if has_history:

        profile = build_user_profile(
            interactions
        )


        print(
            "Using personalized ranking",
            file=sys.stderr
        )


        result["personalization_score"] = (

            result.apply(

                lambda row:
                    calculate_personalization_score(
                        row,
                        profile
                    ),

                axis=1
            )
        )


        result["recommendation_reason"] = (

            result.apply(

                lambda row:
                    generate_recommendation_reason(
                        row,
                        profile
                    ),

                axis=1
            )
        )


        result[
            "personalization_score_normalized"
        ] = normalize_score(

            result[
                "personalization_score"
            ]
        )


    else:

        print(
            "Using non-personalized ranking",
            file=sys.stderr
        )


        result[
            "personalization_score"
        ] = 0


        result[
            "personalization_score_normalized"
        ] = 0


        result[
            "recommendation_reason"
        ] = (
            "Popular with StyleSense shoppers"
        )


    # ========================================================
    # STEP 5
    # POPULARITY
    # ========================================================

    result = add_popularity_score(
        result
    )


    # ========================================================
    # STEP 6
    # RATING
    # ========================================================

    result = add_rating_score(
        result
    )


    # ========================================================
    # STEP 7
    # NORMALIZE SEARCH SCORE
    # ========================================================

    if "search_score" in result.columns:

        result[
            "search_score_normalized"
        ] = normalize_score(

            result[
                "search_score"
            ]
        )

    else:

        result[
            "search_score"
        ] = 0

        result[
            "search_score_normalized"
        ] = 0


    # ========================================================
    # STEP 8
    # FINAL RANKING
    # ========================================================

    if has_history:

        result["final_score"] = (

            result[
                "search_score_normalized"
            ] * 0.55

            +

            result[
                "personalization_score_normalized"
            ] * 0.25

            +

            result[
                "popularity_score"
            ] * 0.15

            +

            result[
                "rating_score"
            ] * 0.05
        )

    else:

        result["final_score"] = (

            result[
                "search_score_normalized"
            ] * 0.65

            +

            result[
                "popularity_score"
            ] * 0.25

            +

            result[
                "rating_score"
            ] * 0.10
        )


    # ========================================================
    # STEP 9
    # SORT + TOP 20
    # ========================================================

    result = (

        result
        .sort_values(
            "final_score",
            ascending=False
        )
        .head(limit)
        .reset_index(drop=True)
    )


    print(
        f"Final results: {len(result)}",
        file=sys.stderr
    )


    return result


# ============================================================
# JSON OUTPUT
# ============================================================

if __name__ == "__main__":

    try:

        input_data = sys.stdin.read()


        if not input_data.strip():

            print(
                json.dumps({
                    "success": False,
                    "error":
                        "No input received"
                })
            )

            sys.exit(1)


        data = json.loads(
            input_data
        )


        query = (
            data
            .get("query", "")
            .strip()
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


        if not query:

            print(
                json.dumps({
                    "success": False,
                    "error":
                        "Search query is required"
                })
            )

            sys.exit(1)


        results = combined_search(

            query=query,

            user_id=user_id,

            limit=limit
        )


        if results is None:

            results = pd.DataFrame()


        results = results.fillna("")


        output_columns = [

            "id",

            "name",

            "image_url",

            "price",

            "mrp",

            "rating",

            "ratingTotal",

            "discount",

            "calculated_discount",

            "seller",

            "gender",

            "category",

            "subcategory",

            "color",

            "fit",

            "style",

            "purl",

            "search_score",

            "search_score_normalized",

            "personalization_score",

            "personalization_score_normalized",

            "recommendation_reason",

            "popularity_score",

            "rating_score",

            "final_score"
        ]


        output_columns = [

            column

            for column in output_columns

            if column in results.columns
        ]


        results = results[
            output_columns
        ]


        response = {

            "success": True,

            "query": query,

            "user_id": user_id,

            "count": len(results),

            "products":
                results.to_dict(
                    orient="records"
                )
        }


        print(
            json.dumps(
                response,
                default=str
            )
        )


    except Exception as e:

        import traceback

        traceback.print_exc(
            file=sys.stderr
        )


        print(
            json.dumps({
                "success": False,
                "error": str(e)
            })
        )


        sys.exit(1)

