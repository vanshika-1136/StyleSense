import pandas as pd
import re


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(value):

    if pd.isna(value):
        return ""

    value = str(value).lower().strip()

    value = re.sub(
        r"[^a-z0-9\s]",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value


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


# ============================================================
# TOKENIZATION
# ============================================================

def tokenize(query):

    query = normalize_text(query)

    return [
        word
        for word in query.split()
        if word not in STOP_WORDS
    ]


# ============================================================
# PREPARE SEARCH DATA
# ============================================================

def prepare_search_data(products):

    products = products.copy()

    text_columns = [
        "name",
        "gender",
        "category",
        "subcategory",
        "color",
        "fit",
        "style"
    ]

    for column in text_columns:

        if column in products.columns:

            products[column] = (
                products[column]
                .fillna("")
                .astype(str)
                .map(normalize_text)
            )

    # Pre-compute words only once
    products["_name_words"] = (
        products["name"]
        .str.split()
    )

    return products


# ============================================================
# FAST SEARCH
# ============================================================

# ============================================================
# FAST SEARCH
# ============================================================

def search_products(
    query,
    products,
    limit=100
):

    if products.empty:
        return pd.DataFrame()

    query = query.strip()

    if not query:

        result = products.head(limit).copy()
        result["search_score"] = 0.0

        return result

    tokens = tokenize(query)

    if not tokens:

        result = products.head(limit).copy()
        result["search_score"] = 0.0

        return result

    # ========================================================
    # DETECT EXPLICIT ATTRIBUTES
    # ========================================================

    detected_colors = []
    detected_categories = []

    # Get unique values from dataset
    available_colors = set()

    if "color" in products.columns:
        available_colors = set(
            products["color"]
            .dropna()
            .astype(str)
            .map(normalize_text)
            .unique()
        )

    available_categories = set()

    if "category" in products.columns:
        available_categories = set(
            products["category"]
            .dropna()
            .astype(str)
            .map(normalize_text)
            .unique()
        )

    available_subcategories = set()

    if "subcategory" in products.columns:
        available_subcategories = set(
            products["subcategory"]
            .dropna()
            .astype(str)
            .map(normalize_text)
            .unique()
        )

    # --------------------------------------------------------
    # Detect colors
    # --------------------------------------------------------

    for token in tokens:

        for color in available_colors:

            if (
                token == color
                or token in color.split()
            ):
                detected_colors.append(color)

    # Remove duplicates
    detected_colors = list(set(detected_colors))

    # --------------------------------------------------------
    # Detect categories
    # --------------------------------------------------------

    for token in tokens:

        for category in available_categories:

            if (
                token == category
                or token in category.split()
            ):
                detected_categories.append(category)

    detected_categories = list(set(detected_categories))

    # ========================================================
    # BASE SEARCH SCORE
    # ========================================================

    scores = pd.Series(
        0.0,
        index=products.index
    )

    # --------------------------------------------------------
    # SEARCH EACH TOKEN
    # --------------------------------------------------------

    for token in tokens:

        # NAME
        name_contains = (
            products["name"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
        )

        scores += (
            name_contains.astype(float) * 10
        )

        # Exact word in name
        name_exact = products["_name_words"].map(
            lambda words: token in words
        )

        scores += (
            name_exact.astype(float) * 5
        )

        # CATEGORY
        scores += (
            products["category"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 8
        )

        # SUBCATEGORY
        scores += (
            products["subcategory"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 7
        )

        # COLOR
        scores += (
            products["color"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 7
        )

        # STYLE
        scores += (
            products["style"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 5
        )

        # GENDER
        scores += (
            products["gender"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 3
        )

        # FIT
        scores += (
            products["fit"]
            .str.contains(
                token,
                regex=False,
                na=False
            )
            .astype(float)
            * 3
        )

    # ========================================================
    # EXPLICIT ATTRIBUTE BOOST
    # ========================================================

    # If user explicitly mentioned a color,
    # give matching products a VERY strong boost.

    if detected_colors:

        color_match = pd.Series(
            False,
            index=products.index
        )

        for color in detected_colors:

            color_match |= (
                products["color"]
                .str.contains(
                    color,
                    regex=False,
                    na=False
                )
            )

        scores += (
            color_match.astype(float) * 40
        )

    # --------------------------------------------------------
    # Explicit category boost
    # --------------------------------------------------------

    if detected_categories:

        category_match = pd.Series(
            False,
            index=products.index
        )

        for category in detected_categories:

            category_match |= (
                products["category"]
                .str.contains(
                    category,
                    regex=False,
                    na=False
                )
            )

        scores += (
            category_match.astype(float) * 30
        )

    # ========================================================
    # ATTACH SCORE
    # ========================================================

    result = products.copy()

    result["search_score"] = scores

    # ========================================================
    # REMOVE NON-MATCHES
    # ========================================================

    result = result[
        result["search_score"] > 0
    ]

    if result.empty:
        return result

    # ========================================================
    # SORT
    # ========================================================

    result = result.sort_values(
        by="search_score",
        ascending=False,
        kind="stable"
    )

    return result.head(limit)
# def search_products(
#     query,
#     products,
#     limit=100
# ):

#     if products.empty:
#         return pd.DataFrame()

#     query = query.strip()

#     if not query:

#         result = products.head(limit).copy()

#         result["search_score"] = 0.0

#         return result

#     tokens = tokenize(query)

#     if not tokens:

#         result = products.head(limit).copy()

#         result["search_score"] = 0.0

#         return result

#     scores = pd.Series(
#         0.0,
#         index=products.index
#     )

#     # --------------------------------------------------------
#     # SEARCH EACH TOKEN
#     # --------------------------------------------------------

#     for token in tokens:

#         # NAME
#         name_contains = (
#             products["name"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += (
#             name_contains.astype(float) * 10
#         )

#         # Exact word in name
#         name_exact = products["_name_words"].map(
#             lambda words: token in words
#         )

#         scores += (
#             name_exact.astype(float) * 5
#         )

#         # CATEGORY
#         scores += (
#             products["category"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 8
#         )

#         # SUBCATEGORY
#         scores += (
#             products["subcategory"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 7
#         )

#         # COLOR
#         scores += (
#             products["color"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 7
#         )

#         # STYLE
#         scores += (
#             products["style"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 5
#         )

#         # GENDER
#         scores += (
#             products["gender"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 3
#         )

#         # FIT
#         scores += (
#             products["fit"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#             .astype(float)
#             * 3
#         )

#     # --------------------------------------------------------
#     # ATTACH SCORE
#     # --------------------------------------------------------

#     result = products.copy()

#     result["search_score"] = scores

#     # --------------------------------------------------------
#     # REMOVE NON-MATCHES
#     # --------------------------------------------------------

#     result = result[
#         result["search_score"] > 0
#     ]

#     if result.empty:
#         return result

#     # --------------------------------------------------------
#     # SORT
#     # --------------------------------------------------------

#     result = result.sort_values(
#         by="search_score",
#         ascending=False,
#         kind="stable"
#     )

#     return result.head(limit)
# import pandas as pd
# import re
# import sys
# import json
# import os


# # ============================================================
# # CONFIG
# # ============================================================

# # BASE_DIR = os.path.dirname(
# #     os.path.abspath(__file__)
# # )

# # PRODUCT_FILE = os.path.join(
# #     BASE_DIR,
# #     "stylesense_products_clean.csv"
# # )


# # ============================================================
# # LOAD PRODUCTS
# # ============================================================

# products = pd.read_csv(
#     PRODUCT_FILE,
#     low_memory=False
# )

# products.columns = products.columns.str.strip()

# products["id"] = products["id"].astype(str)


# # ============================================================
# # NORMALIZATION
# # ============================================================

# def normalize_text(value):

#     if pd.isna(value):
#         return ""

#     value = str(value).lower().strip()

#     value = re.sub(
#         r"[^a-z0-9\s]",
#         " ",
#         value
#     )

#     value = re.sub(
#         r"\s+",
#         " ",
#         value
#     )

#     return value


# TEXT_COLUMNS = [
#     "name",
#     "gender",
#     "category",
#     "subcategory",
#     "color",
#     "fit",
#     "style"
# ]


# for column in TEXT_COLUMNS:

#     if column in products.columns:

#         products[column] = (
#             products[column]
#             .fillna("")
#             .astype(str)
#             .map(normalize_text)
#         )


# # ============================================================
# # PRE-COMPUTE WORD SETS
# # ============================================================

# # This avoids repeatedly doing .split() during every search.

# for column in TEXT_COLUMNS:

#     if column in products.columns:

#         products[f"_{column}_words"] = (
#             products[column]
#             .str.split()
#         )


# # ============================================================
# # STOP WORDS
# # ============================================================

# STOP_WORDS = {
#     "a",
#     "an",
#     "the",
#     "for",
#     "with",
#     "and",
#     "or",
#     "of",
#     "in",
#     "on",
#     "to",
#     "is",
#     "me",
#     "show",
#     "find",
#     "want",
#     "looking"
# }


# # ============================================================
# # TOKENIZATION
# # ============================================================

# def tokenize(query):

#     query = normalize_text(query)

#     return [
#         word
#         for word in query.split()
#         if word not in STOP_WORDS
#     ]


# # ============================================================
# # FAST SEARCH
# # ============================================================

# def search_products(query, limit=100):

#     query = query.strip()

#     # --------------------------------------------------------
#     # NO QUERY
#     # --------------------------------------------------------

#     if not query:

#         result = products.head(limit).copy()

#         result["search_score"] = 0

#         return result


#     # --------------------------------------------------------
#     # TOKENS
#     # --------------------------------------------------------

#     tokens = tokenize(query)

#     if not tokens:

#         result = products.head(limit).copy()

#         result["search_score"] = 0

#         return result


#     # --------------------------------------------------------
#     # SEARCH SCORE
#     # --------------------------------------------------------

#     scores = pd.Series(
#         0.0,
#         index=products.index
#     )


#     # ========================================================
#     # EACH TOKEN
#     # ========================================================

#     for token in tokens:

#         # ----------------------------------------------------
#         # NAME
#         # ----------------------------------------------------

#         name_contains = (
#             products["name"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += name_contains.astype(float) * 10


#         # Exact word in name
#         name_exact = (
#             products["_name_words"]
#             .map(
#                 lambda words:
#                 token in words
#             )
#         )

#         scores += name_exact.astype(float) * 5


#         # ----------------------------------------------------
#         # CATEGORY
#         # ----------------------------------------------------

#         category_match = (
#             products["category"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += category_match.astype(float) * 8


#         # ----------------------------------------------------
#         # SUBCATEGORY
#         # ----------------------------------------------------

#         subcategory_match = (
#             products["subcategory"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += subcategory_match.astype(float) * 7


#         # ----------------------------------------------------
#         # COLOR
#         # ----------------------------------------------------

#         color_match = (
#             products["color"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += color_match.astype(float) * 7


#         # ----------------------------------------------------
#         # STYLE
#         # ----------------------------------------------------

#         style_match = (
#             products["style"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += style_match.astype(float) * 5


#         # ----------------------------------------------------
#         # GENDER
#         # ----------------------------------------------------

#         gender_match = (
#             products["gender"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += gender_match.astype(float) * 3


#         # ----------------------------------------------------
#         # FIT
#         # ----------------------------------------------------

#         fit_match = (
#             products["fit"]
#             .str.contains(
#                 token,
#                 regex=False,
#                 na=False
#             )
#         )

#         scores += fit_match.astype(float) * 3


#     # ========================================================
#     # ATTACH SCORE
#     # ========================================================

#     result = products.copy()

#     result["search_score"] = scores


#     # ========================================================
#     # REMOVE NON-MATCHES
#     # ========================================================

#     result = result[
#         result["search_score"] > 0
#     ]


#     # ========================================================
#     # SORT
#     # ========================================================

#     result = result.sort_values(
#         by="search_score",
#         ascending=False,
#         kind="stable"
#     )


#     # ========================================================
#     # RETURN ONLY REQUIRED PRODUCTS
#     # ========================================================

#     return result.head(limit)


# # ============================================================
# # CLI
# # ============================================================

# if __name__ == "__main__":

#     try:

#         # ----------------------------------------------------
#         # READ JSON FROM NODE
#         # ----------------------------------------------------

#         input_data = sys.stdin.read()

#         if input_data.strip():

#             data = json.loads(input_data)

#             query = data.get(
#                 "query",
#                 ""
#             )

#         else:

#             query = ""


#         # ----------------------------------------------------
#         # SEARCH
#         # ----------------------------------------------------

#         results = search_products(
#             query
#         )


#         # ----------------------------------------------------
#         # REMOVE HELPER COLUMNS
#         # ----------------------------------------------------

#         helper_columns = [
#             column
#             for column in results.columns
#             if column.startswith("_")
#         ]

#         results = results.drop(
#             columns=helper_columns,
#             errors="ignore"
#         )


#         # ----------------------------------------------------
#         # CLEAN NaN
#         # ----------------------------------------------------

#         results = results.fillna("")


#         # ----------------------------------------------------
#         # RETURN JSON
#         # ----------------------------------------------------

#         print(
#             json.dumps(
#                 {
#                     "success": True,
#                     "count": len(results),
#                     "products": results.to_dict(
#                         orient="records"
#                     )
#                 },
#                 default=str
#             )
#         )


#     except Exception as error:

#         print(
#             json.dumps(
#                 {
#                     "success": False,
#                     "error": str(error)
#                 }
#             )
#         )

#         sys.exit(1)