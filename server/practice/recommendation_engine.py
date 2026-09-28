import pandas as pd
import numpy as np

# Old standalone recommendation system using interaction CSV directly

# ============================================
# CONFIG
# ============================================

PRODUCT_FILE = "stylesense_products_100k.csv"
INTERACTION_FILE = "stylesense_interactions_clean.csv"


# ============================================
# LOAD DATA
# ============================================

print("Loading products...")
products = pd.read_csv(PRODUCT_FILE)

print("Loading interactions...")
interactions = pd.read_csv(INTERACTION_FILE)

print("Data loaded.")


# ============================================
# CLEAN DATA
# ============================================

attributes = [
    "gender",
    "category",
    "subcategory",
    "color",
    "fit",
    "style"
]

for col in attributes:
    products[col] = (
        products[col]
        .fillna("Unknown")
        .astype(str)
    )

products["name"] = (
    products["name"]
    .fillna("")
    .astype(str)
)

products["name_lower"] = products["name"].str.lower()


# ============================================
# INTERACTION WEIGHTS
# ============================================

interaction_weights = {
    "view": 1,
    "click": 2,
    "add_to_wishlist": 5,
    "add_to_cart": 7,
    "remove_from_wishlist": -4,
    "remove_from_cart": -5
}

interactions["weight"] = (
    interactions["interaction_type"]
    .map(interaction_weights)
    .fillna(0)
)


# ============================================
# DWELL TIME BONUS
# ============================================

def dwell_bonus(milliseconds):

    seconds = milliseconds / 1000

    if seconds < 3:
        return 0
    elif seconds < 10:
        return 1
    elif seconds < 30:
        return 2
    elif seconds < 60:
        return 3
    else:
        return 4


interactions["dwell_bonus"] = (
    interactions["dwell_time_ms"]
    .apply(dwell_bonus)
)


# ============================================
# FINAL BEHAVIOR SCORE
# ============================================

interactions["behavior_score"] = (
    interactions["weight"]
    + interactions["dwell_bonus"]
)


# ============================================
# BUILD USER PROFILE
# ============================================

def build_user_profile(user_id):

    user_interactions = interactions[
        interactions["user_id"] == user_id
    ]

    if user_interactions.empty:
        return None

    merged = user_interactions.merge(
        products,
        left_on="product_id",
        right_on="id",
        how="inner"
    )

    if merged.empty:
        return None

    preferences = {}

    for attribute in attributes:

        # Ignore Unknown values
        valid = merged[
            merged[attribute] != "Unknown"
        ]

        if valid.empty:
            preferences[attribute] = pd.Series(
                dtype=float
            )
            continue

        preference_scores = (
            valid
            .groupby(attribute)["behavior_score"]
            .sum()
            .sort_values(
                ascending=False
            )
        )

        preferences[attribute] = (
            preference_scores
        )

    return preferences


# ============================================
# PRODUCT NAME SIGNALS
# ============================================

def calculate_name_match(
    product,
    preferences
):

    name = product["name_lower"]

    score = 0

    # ----------------------------------------
    # Check preferred categories
    # ----------------------------------------

    category_scores = preferences[
        "category"
    ]

    for value, pref_score in category_scores.head(5).items():

        if value.lower() in name:

            score += min(
                pref_score / 5,
                5
            )

    # ----------------------------------------
    # Check preferred colors
    # ----------------------------------------

    color_scores = preferences[
        "color"
    ]

    for value, pref_score in color_scores.head(5).items():

        if value.lower() in name:

            score += min(
                pref_score / 5,
                4
            )

    # ----------------------------------------
    # Check preferred styles
    # ----------------------------------------

    style_scores = preferences[
        "style"
    ]

    for value, pref_score in style_scores.head(5).items():

        if value.lower() in name:

            score += min(
                pref_score / 5,
                4
            )

    return score


# ============================================
# PRODUCT SCORE
# ============================================

def calculate_product_score(
    product,
    preferences
):

    score = 0

    attribute_weights = {
        "category": 5,
        "style": 4,
        "color": 4,
        "subcategory": 2,
        "fit": 2,
        "gender": 1
    }

    # ----------------------------------------
    # Structured attribute matching
    # ----------------------------------------

    for attribute, weight in attribute_weights.items():

        value = product[attribute]

        # Never reward Unknown
        if value == "Unknown":
            continue

        preference_scores = preferences[
            attribute
        ]

        if value in preference_scores.index:

            preference_score = (
                preference_scores[value]
            )

            normalized_score = np.tanh(
                preference_score / 10
            )

            score += (
                normalized_score
                * weight
            )

    # ----------------------------------------
    # Product name matching
    # ----------------------------------------

    score += calculate_name_match(
        product,
        preferences
    )

    # ----------------------------------------
    # Rating bonus
    # ----------------------------------------

    rating = product.get(
        "rating",
        0
    )

    if pd.notna(rating):

        score += min(
            float(rating),
            5
        ) * 0.5

    # ----------------------------------------
    # Popularity bonus
    # ----------------------------------------

    popularity = product.get(
        "popularity_score",
        0
    )

    if pd.notna(popularity):

        score += min(
            float(popularity) / 100,
            2
        )

    return score


# ============================================
# RECOMMEND PRODUCTS
# ============================================

def recommend(
    user_id,
    top_n=10
):

    print(
        f"\nGenerating recommendations "
        f"for {user_id}..."
    )

    preferences = build_user_profile(
        user_id
    )

    if preferences is None:

        return products.sample(
            top_n
        )

    # ----------------------------------------
    # Remove products already seen
    # ----------------------------------------

    seen_products = set(
        interactions[
            interactions["user_id"] == user_id
        ]["product_id"]
        .astype(str)
    )

    candidates = products[
        ~products["id"]
        .astype(str)
        .isin(seen_products)
    ].copy()

    # ----------------------------------------
    # Candidate sampling
    # ----------------------------------------

    candidates = candidates.sample(
        min(
            10000,
            len(candidates)
        ),
        random_state=42
    )

    # ----------------------------------------
    # Calculate recommendation score
    # ----------------------------------------

    candidates[
        "recommendation_score"
    ] = candidates.apply(
        lambda row:
        calculate_product_score(
            row,
            preferences
        ),
        axis=1
    )

    # ----------------------------------------
    # Rank products
    # ----------------------------------------

    recommendations = (
        candidates
        .sort_values(
            "recommendation_score",
            ascending=False
        )
        .head(top_n)
    )

    return recommendations


# ============================================
# EXPLANATION ENGINE
# ============================================

def explain_recommendation(
    user_id,
    product
):

    preferences = build_user_profile(
        user_id
    )

    if preferences is None:

        return [
            "Popular product"
        ]

    reasons = []

    explanation_attributes = [
        "category",
        "color",
        "style",
        "fit",
        "subcategory"
    ]

    for attribute in explanation_attributes:

        value = product[attribute]

        if value == "Unknown":
            continue

        if value in preferences[attribute].index:

            score = preferences[
                attribute
            ][value]

            if score > 0:

                reasons.append(
                    f"Matches your preference "
                    f"for {value} {attribute}"
                )

    # Product name match
    name = product["name_lower"]

    for attribute in [
        "category",
        "color",
        "style"
    ]:

        preference_scores = (
            preferences[attribute]
        )

        for value in preference_scores.head(3).index:

            if value != "Unknown" and value.lower() in name:

                reasons.append(
                    f"Product name matches "
                    f"your interest in {value}"
                )

                break

    if not reasons:

        reasons.append(
            "Matches your recent browsing behavior"
        )

    return reasons[:3]


# ============================================
# DISPLAY USER PROFILE
# ============================================

def show_user_profile(user_id):

    preferences = build_user_profile(
        user_id
    )

    if preferences is None:

        print("No user history found.")
        return

    print("\n================================")
    print("USER PREFERENCE PROFILE")
    print("================================")

    for attribute, scores in preferences.items():

        print(f"\n{attribute.upper()}")

        if scores.empty:

            print("No useful data")

        else:

            print(
                scores.head(5)
            )


# ============================================
# TEST
# ============================================

if __name__ == "__main__":

    test_user = interactions[
        "user_id"
    ].iloc[0]

    print(
        f"\nTest user: {test_user}"
    )

    # ----------------------------------------
    # USER PROFILE
    # ----------------------------------------

    show_user_profile(
        test_user
    )

    # ----------------------------------------
    # RECOMMENDATIONS
    # ----------------------------------------

    recommendations = recommend(
        test_user,
        top_n=10
    )

    print("\n================================")
    print("RECOMMENDATIONS")
    print("================================")

    display_columns = [
        "id",
        "name",
        "price",
        "rating",
        "category",
        "color",
        "fit",
        "style",
        "recommendation_score"
    ]

    print(
        recommendations[
            display_columns
        ].to_string(index=False)
    )

    # ----------------------------------------
    # EXPLANATIONS
    # ----------------------------------------

    print("\n================================")
    print("WHY RECOMMENDED?")
    print("================================")

    for _, product in recommendations.head(5).iterrows():

        reasons = explain_recommendation(
            test_user,
            product
        )

        print(
            f"\n{product['name']}"
        )

        for reason in reasons:

            print(
                f"  ✓ {reason}"
            )