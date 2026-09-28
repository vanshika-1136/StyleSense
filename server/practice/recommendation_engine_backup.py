import pandas as pd
import numpy as np


# ============================================
# CONFIG
# ============================================

PRODUCT_FILE = "stylesense_products_100k.csv"
INTERACTION_FILE = "stylesense_interactions.csv"


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
    products[col] = products[col].fillna("Unknown").astype(str)


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
# USER PREFERENCE ENGINE
# ============================================

def build_user_profile(user_id):

    user_interactions = interactions[
        interactions["user_id"] == user_id
    ]

    if user_interactions.empty:
        return None

    # ----------------------------------------
    # Connect interactions with products
    # ----------------------------------------

    merged = user_interactions.merge(
        products,
        left_on="product_id",
        right_on="id",
        how="inner"
    )

    if merged.empty:
        return None

    # ----------------------------------------
    # Calculate preference weights
    # ----------------------------------------

    preferences = {}

    for attribute in attributes:

        preference_scores = (
            merged
            .groupby(attribute)["behavior_score"]
            .sum()
            .sort_values(ascending=False)
        )

        preferences[attribute] = preference_scores

    return preferences


# ============================================
# PRODUCT MATCH SCORE
# ============================================

def calculate_product_score(
    product,
    preferences
):

    score = 0

    # Different importance for each attribute

    attribute_weights = {
        "gender": 1,
        "category": 3,
        "subcategory": 2,
        "color": 3,
        "fit": 2,
        "style": 3
    }

    for attribute, weight in attribute_weights.items():

        value = product[attribute]

        if value in preferences[attribute].index:

            preference_score = preferences[
                attribute
            ][value]

            # Normalize preference score
            normalized_score = np.tanh(
                preference_score / 10
            )

            score += (
                normalized_score
                * weight
            )

    # ----------------------------------------
    # Popularity
    # ----------------------------------------

    popularity = product.get(
        "popularity_score",
        0
    )

    popularity_bonus = min(
        popularity / 100,
        2
    )

    score += popularity_bonus

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

    # ----------------------------------------
    # Build profile
    # ----------------------------------------

    preferences = build_user_profile(
        user_id
    )

    if preferences is None:

        print(
            "User has no interaction history."
        )

        return products.sample(
            top_n
        )

    # ----------------------------------------
    # Get already interacted products
    # ----------------------------------------

    seen_products = set(
        interactions[
            interactions["user_id"] == user_id
        ]["product_id"]
    )

    # ----------------------------------------
    # Candidate products
    # ----------------------------------------

    candidates = products[
        ~products["id"].astype(str).isin(
            seen_products
        )
    ].copy()

    # Limit candidates for faster processing

    candidates = candidates.sample(
        min(5000, len(candidates)),
        random_state=42
    )

    # ----------------------------------------
    # Calculate scores
    # ----------------------------------------

    candidates["recommendation_score"] = (
        candidates.apply(
            lambda row:
            calculate_product_score(
                row,
                preferences
            ),
            axis=1
        )
    )

    # ----------------------------------------
    # Rank
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

    reasons = []

    if preferences is None:
        return [
            "Popular product"
        ]

    # ----------------------------------------
    # Find strongest matching attributes
    # ----------------------------------------

    explanation_attributes = [
        "color",
        "category",
        "fit",
        "style",
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
                    f"You frequently interact "
                    f"with {value} {attribute}"
                )

    # Limit explanations

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

        print(
            scores.head(5)
        )


# ============================================
# TEST
# ============================================

if __name__ == "__main__":

    # Pick a user from the dataset

    test_user = interactions[
        "user_id"
    ].iloc[0]

    print(
        f"\nTest user: {test_user}"
    )

    # ----------------------------------------
    # Show learned preferences
    # ----------------------------------------

    show_user_profile(
        test_user
    )

    # ----------------------------------------
    # Generate recommendations
    # ----------------------------------------

    recommendations = recommend(
        test_user,
        top_n=10
    )

    # ----------------------------------------
    # Display recommendations
    # ----------------------------------------

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
    # Explain recommendations
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
            print(f"  ✓ {reason}")