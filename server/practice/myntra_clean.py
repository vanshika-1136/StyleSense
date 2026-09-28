import pandas as pd
import numpy as np
import re

# ============================================================
# 1. LOAD DATA
# ============================================================

INPUT_FILE = "myntra_products.csv"
OUTPUT_FILE = "stylesense_products.csv"

print("Loading dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Original shape: {df.shape}")


# ============================================================
# 2. KEEP REQUIRED COLUMNS
# ============================================================

columns_to_keep = [
    "id",
    "name",
    "img",
    "price",
    "mrp",
    "rating",
    "ratingTotal",
    "discount",
    "seller",
    "purl"
]

df = df[columns_to_keep].copy()


# ============================================================
# 3. REMOVE DUPLICATES
# ============================================================

df = df.drop_duplicates(subset="id")

print(f"After removing duplicates: {df.shape}")


# ============================================================
# 4. CLEAN TEXT COLUMNS
# ============================================================

text_columns = [
    "name",
    "seller",
    "purl"
]

for col in text_columns:
    df[col] = df[col].fillna("").astype(str).str.strip()


# ============================================================
# 5. CLEAN NUMERIC COLUMNS
# ============================================================

numeric_columns = [
    "price",
    "mrp",
    "rating",
    "ratingTotal",
    "discount"
]

for col in numeric_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")


# ============================================================
# 6. REMOVE INVALID PRODUCTS
# ============================================================

df = df[
    (df["name"] != "") &
    (df["price"].notna()) &
    (df["price"] > 0)
].copy()


# ============================================================
# 7. EXTRACT GENDER
# ============================================================

def extract_gender(name):
    name = name.lower()

    if re.search(r"\bmen\b|\bman\b|\bmens\b", name):
        return "Men"

    if re.search(r"\bwomen\b|\bwoman\b|\bwomens\b|\bladies\b", name):
        return "Women"

    if re.search(r"\bboys\b|\bboy\b|\bkids\b|\bchildren\b", name):
        return "Kids"

    if re.search(r"\bgirls\b|\bgirl\b", name):
        return "Kids"

    return "Unisex"


df["gender"] = df["name"].apply(extract_gender)


# ============================================================
# 8. EXTRACT CATEGORY
# ============================================================

def extract_category(name, url):
    text = (name + " " + url).lower()

    category_patterns = {
        "T-Shirts": [
            "tshirt",
            "t-shirt",
            "t shirts",
            "t shirt"
        ],

        "Shirts": [
            "shirt"
        ],

        "Jeans": [
            "jeans"
        ],

        "Trousers": [
            "trouser",
            "formal pants",
            "formal trousers"
        ],

        "Pants": [
            "pants"
        ],

        "Shorts": [
            "shorts"
        ],

        "Dresses": [
            "dress"
        ],

        "Skirts": [
            "skirt"
        ],

        "Hoodies": [
            "hoodie",
            "hooded sweatshirt"
        ],

        "Sweatshirts": [
            "sweatshirt"
        ],

        "Jackets": [
            "jacket"
        ],

        "Sweaters": [
            "sweater",
            "cardigan"
        ],

        "Kurtas": [
            "kurta",
            "kurti"
        ],

        "Sarees": [
            "saree",
            "sari"
        ],

        "Ethnic Wear": [
            "ethnic wear",
            "lehenga",
            "salwar",
            "anarkali"
        ],

        "Shoes": [
            "shoes",
            "footwear"
        ],

        "Sneakers": [
            "sneaker"
        ],

        "Sandals": [
            "sandal"
        ],

        "Heels": [
            "heels",
            "heel"
        ],

        "Bags": [
            "bag",
            "backpack",
            "handbag",
            "sling bag"
        ],

        "Watches": [
            "watch"
        ],

        "Sunglasses": [
            "sunglasses",
            "sunglass"
        ],

        "Accessories": [
            "belt",
            "wallet",
            "cap",
            "hat",
            "scarf"
        ]
    }

    for category, keywords in category_patterns.items():
        for keyword in keywords:
            if keyword in text:
                return category

    return "Other"


df["category"] = df.apply(
    lambda row: extract_category(row["name"], row["purl"]),
    axis=1
)


# ============================================================
# 9. EXTRACT COLOR
# ============================================================

def extract_color(name, url):
    text = (name + " " + url).lower()

    color_patterns = {
        "Black": [
            "black"
        ],
        "White": [
            "white"
        ],
        "Red": [
            "red",
            "maroon",
            "burgundy"
        ],
        "Blue": [
            "blue",
            "navy"
        ],
        "Green": [
            "green",
            "olive",
            "mint"
        ],
        "Yellow": [
            "yellow",
            "mustard"
        ],
        "Orange": [
            "orange"
        ],
        "Pink": [
            "pink",
            "peach"
        ],
        "Purple": [
            "purple",
            "violet",
            "lavender"
        ],
        "Grey": [
            "grey",
            "gray"
        ],
        "Brown": [
            "brown",
            "coffee",
            "tan"
        ],
        "Beige": [
            "beige"
        ],
        "Cream": [
            "cream"
        ],
        "Gold": [
            "gold"
        ],
        "Silver": [
            "silver"
        ],
        "Multicolor": [
            "multi",
            "multicolor"
        ]
    }

    for color, keywords in color_patterns.items():
        for keyword in keywords:
            if keyword in text:
                return color

    return "Unknown"


df["color"] = df.apply(
    lambda row: extract_color(row["name"], row["purl"]),
    axis=1
)


# ============================================================
# 10. EXTRACT FIT
# ============================================================

def extract_fit(name):
    name = name.lower()

    fit_patterns = {
        "Oversized": [
            "oversized",
            "oversize"
        ],

        "Slim": [
            "slim fit",
            "slim"
        ],

        "Regular": [
            "regular fit",
            "regular"
        ],

        "Relaxed": [
            "relaxed fit",
            "relaxed"
        ],

        "Loose": [
            "loose fit",
            "loose"
        ],

        "Skinny": [
            "skinny fit",
            "skinny"
        ],

        "Straight": [
            "straight fit",
            "straight"
        ],

        "Comfort": [
            "comfort fit",
            "comfort"
        ]
    }

    for fit, keywords in fit_patterns.items():
        for keyword in keywords:
            if keyword in name:
                return fit

    return "Unknown"


df["fit"] = df["name"].apply(extract_fit)


# ============================================================
# 11. EXTRACT STYLE
# ============================================================

def extract_style(name):
    name = name.lower()

    style_patterns = {
        "Casual": [
            "casual",
            "everyday",
            "daily wear"
        ],

        "Formal": [
            "formal",
            "office",
            "business"
        ],

        "Sports": [
            "sports",
            "sport",
            "gym",
            "running",
            "training",
            "athletic"
        ],

        "Streetwear": [
            "streetwear",
            "street",
            "oversized",
            "graphic"
        ],

        "Party": [
            "party",
            "partywear"
        ],

        "Ethnic": [
            "ethnic",
            "traditional",
            "kurta",
            "kurti",
            "saree",
            "lehenga"
        ]
    }

    for style, keywords in style_patterns.items():
        for keyword in keywords:
            if keyword in name:
                return style

    return "Casual"


df["style"] = df["name"].apply(extract_style)


# ============================================================
# 12. EXTRACT SUBCATEGORY
# ============================================================

def extract_subcategory(name):
    name = name.lower()

    patterns = {
        "Round Neck": ["round neck"],
        "V-Neck": ["v-neck", "v neck"],
        "Polo": ["polo"],
        "Crop Top": ["crop top", "cropped"],
        "Tank Top": ["tank top"],
        "Full Sleeve": ["full sleeve", "full sleeves"],
        "Half Sleeve": ["half sleeve", "half sleeves"],
        "Cargo": ["cargo"],
        "Joggers": ["jogger", "joggers"],
        "Track Pants": ["track pants"],
        "Bootcut": ["bootcut"],
        "Flared": ["flared", "flare"],
        "Printed": ["printed", "print"],
        "Solid": ["solid"],
        "Graphic": ["graphic"]
    }

    for subcategory, keywords in patterns.items():
        for keyword in keywords:
            if keyword in name:
                return subcategory

    return "Other"


df["subcategory"] = df["name"].apply(extract_subcategory)


# ============================================================
# 13. CALCULATE DISCOUNT PERCENTAGE
# ============================================================

df["calculated_discount"] = np.where(
    (df["mrp"] > 0) & (df["price"] > 0),
    ((df["mrp"] - df["price"]) / df["mrp"]) * 100,
    0
)

df["calculated_discount"] = (
    df["calculated_discount"]
    .clip(lower=0, upper=100)
    .round(2)
)


# ============================================================
# 14. CREATE POPULARITY SCORE
# ============================================================

df["popularity_score"] = (
    df["rating"].fillna(0) *
    np.log1p(df["ratingTotal"].fillna(0))
)


# ============================================================
# 15. CLEAN IMAGE URL
# ============================================================

def get_first_image(img):
    if not img:
        return ""

    images = img.split(";")

    return images[0].strip()


df["image_url"] = df["img"].apply(get_first_image)


# ============================================================
# 16. SELECT FINAL COLUMNS
# ============================================================

final_columns = [
    "id",
    "name",
    "image_url",
    "price",
    "mrp",
    "rating",
    "ratingTotal",
    "discount",
    "calculated_discount",
    "popularity_score",
    "seller",
    "gender",
    "category",
    "subcategory",
    "color",
    "fit",
    "style",
    "purl"
]

df = df[final_columns]


# ============================================================
# 17. FINAL CLEANUP
# ============================================================

df = df.drop_duplicates(subset="id")

df = df.reset_index(drop=True)


# ============================================================
# 18. SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# 19. SUMMARY
# ============================================================

print("\n========================================")
print("StyleSense dataset created successfully")
print("========================================")

print(f"Final shape: {df.shape}")

print("\nColumns:")
print(df.columns.tolist())

print("\nCategory distribution:")
print(df["category"].value_counts().head(15))

print("\nGender distribution:")
print(df["gender"].value_counts())

print("\nColor distribution:")
print(df["color"].value_counts().head(15))

print("\nSample:")
print(df.head(5).to_string())

print(f"\nSaved as: {OUTPUT_FILE}")

