import pandas as pd
import re
import sys
import json


# ============================================================
# CONFIG
# ============================================================
import os

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PRODUCT_FILE = os.path.join(
    BASE_DIR,
    "stylesense_products_clean.csv"
)


# ============================================================
# LOAD PRODUCTS
# ============================================================

products = pd.read_csv(PRODUCT_FILE)

products.columns = products.columns.str.strip()

# Make product id string so it can match Neon product_id
products["id"] = products["id"].astype(str)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(value):
    if pd.isna(value):
        return ""

    value = str(value).lower().strip()

    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value


# Normalize important columns

TEXT_COLUMNS = [
    "name",
    "gender",
    "category",
    "subcategory",
    "color",
    "fit",
    "style"
]

for column in TEXT_COLUMNS:
    if column in products.columns:
        products[column] = products[column].fillna("").apply(normalize_text)


# ============================================================
# SEARCH TOKENIZATION
# ============================================================

STOP_WORDS = {
    "a",
    "an",
    "the",
    "for",
    "with",
    "and",
    "or",
    "of",
    "in",
    "on",
    "to",
    "is",
    "me",
    "show",
    "find",
    "want",
    "looking"
}


def tokenize(query):

    query = normalize_text(query)

    words = query.split()

    return [
        word
        for word in words
        if word not in STOP_WORDS
    ]


# ============================================================
# SEARCH SCORE
# ============================================================

def calculate_search_score(product, query):

    tokens = tokenize(query)

    if not tokens:
        return 0

    score = 0

    name = str(product.get("name", ""))
    category = str(product.get("category", ""))
    subcategory = str(product.get("subcategory", ""))
    color = str(product.get("color", ""))
    style = str(product.get("style", ""))
    gender = str(product.get("gender", ""))
    fit = str(product.get("fit", ""))

    for token in tokens:

        # ----------------------------------------------------
        # Name
        # ----------------------------------------------------

        if token in name:
            score += 10

            # Exact word in product name
            if token in name.split():
                score += 5

        # ----------------------------------------------------
        # Category
        # ----------------------------------------------------

        if token in category:
            score += 8

        # ----------------------------------------------------
        # Subcategory
        # ----------------------------------------------------

        if token in subcategory:
            score += 7

        # ----------------------------------------------------
        # Color
        # ----------------------------------------------------

        if token in color:
            score += 7

        # ----------------------------------------------------
        # Style
        # ----------------------------------------------------

        if token in style:
            score += 5

        # ----------------------------------------------------
        # Gender
        # ----------------------------------------------------

        if token in gender:
            score += 3

        # ----------------------------------------------------
        # Fit
        # ----------------------------------------------------

        if token in fit:
            score += 3

    return score


# ============================================================
# SEARCH PRODUCTS
# ============================================================

def search_products(query, limit=100):

    query = query.strip()

    # No query
    if not query:
        result = products.copy()

        result["search_score"] = 0

        return result.head(limit)

    # Calculate search score
    result = products.copy()

    result["search_score"] = result.apply(
        lambda row: calculate_search_score(row, query),
        axis=1
    )

    # Only products matching the query
    result = result[result["search_score"] > 0]

    # Highest relevance first
    result = result.sort_values(
        by="search_score",
        ascending=False
    )

    return result.head(limit)


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    query = sys.argv[1] if len(sys.argv) > 1 else ""

    results = search_products(query)

    # Convert NaN safely
    results = results.fillna("")

    # JSON output ONLY on stdout
    print(
        json.dumps(
            results.to_dict(orient="records"),
            default=str
        )
    )