import pandas as pd
import numpy as np
import uuid
from datetime import datetime, timedelta

# ==============================
# CONFIG
# ==============================

PRODUCT_FILE = "stylesense_products_100k.csv"
OUTPUT_FILE = "stylesense_interactions.csv"

NUM_USERS = 5000
INTERACTIONS_PER_USER = 20
TOTAL_INTERACTIONS = NUM_USERS * INTERACTIONS_PER_USER

np.random.seed(42)

# ==============================
# LOAD PRODUCTS
# ==============================

print("Loading products...")

products = pd.read_csv(PRODUCT_FILE)

print(f"Products loaded: {len(products):,}")

# Convert useful columns to strings
for col in ["gender", "category", "color", "fit", "style"]:
    products[col] = products[col].fillna("Unknown").astype(str)

# ==============================
# CONVERT DATA TO NUMPY
# ==============================

product_ids = products["id"].to_numpy()

gender = products["gender"].to_numpy()
category = products["category"].to_numpy()
color = products["color"].to_numpy()
fit = products["fit"].to_numpy()
style = products["style"].to_numpy()

all_indices = np.arange(len(products))

# ==============================
# CREATE CATEGORY INDEX
# ==============================

print("Preparing product indexes...")

category_groups = {}

for cat in products["category"].unique():
    category_groups[cat] = np.where(category == cat)[0]

print("Product indexes ready.")

# ==============================
# POSSIBLE VALUES FOR USERS
# ==============================

valid_categories = [
    x for x in products["category"].unique()
    if x != "Unknown"
]

valid_colors = [
    x for x in products["color"].unique()
    if x != "Unknown"
]

valid_styles = [
    x for x in products["style"].unique()
    if x != "Unknown"
]

valid_fits = [
    x for x in products["fit"].unique()
    if x != "Unknown"
]

valid_genders = [
    x for x in products["gender"].unique()
    if x != "Unknown"
]

# ==============================
# INTERACTION TYPES
# ==============================

interaction_types = np.array([
    "view",
    "click",
    "add_to_cart",
    "add_to_wishlist",
    "remove_from_wishlist",
    "remove_from_cart"
])

interaction_probabilities = np.array([
    0.50,
    0.20,
    0.12,
    0.10,
    0.05,
    0.03
])

# ==============================
# GENERATE USERS + INTERACTIONS
# ==============================

print(f"Generating {TOTAL_INTERACTIONS:,} interactions...")

rows = []

start_date = datetime(2026, 1, 1)

for user_num in range(1, NUM_USERS + 1):

    user_id = f"user_{user_num:05d}"

    # --------------------------------
    # Hidden user preferences
    # --------------------------------

    preferred_category = np.random.choice(valid_categories)
    preferred_color = np.random.choice(valid_colors)
    preferred_style = np.random.choice(valid_styles)
    preferred_fit = np.random.choice(valid_fits)
    preferred_gender = np.random.choice(valid_genders)

    # --------------------------------
    # Get products from preferred category
    # --------------------------------

    category_indices = category_groups[preferred_category]

    candidate_size = min(200, len(category_indices))

    candidate_indices = np.random.choice(
        category_indices,
        size=candidate_size,
        replace=False
    )

    # --------------------------------
    # Score candidate products
    # --------------------------------

    candidate_scores = (
        (color[candidate_indices] == preferred_color) * 3
        + (style[candidate_indices] == preferred_style) * 3
        + (fit[candidate_indices] == preferred_fit) * 2
        + (gender[candidate_indices] == preferred_gender) * 2
    )

    # Convert score to probabilities
    probabilities = np.exp(candidate_scores)

    probabilities = probabilities / probabilities.sum()

    # --------------------------------
    # Select preferred products
    # --------------------------------

    preferred_count = int(INTERACTIONS_PER_USER * 0.8)
    random_count = INTERACTIONS_PER_USER - preferred_count

    preferred_products = np.random.choice(
        candidate_indices,
        size=preferred_count,
        replace=True,
        p=probabilities
    )

    # --------------------------------
    # Exploration products
    # --------------------------------

    random_products = np.random.choice(
        all_indices,
        size=random_count,
        replace=True
    )

    selected_products = np.concatenate([
        preferred_products,
        random_products
    ])

    # Shuffle interaction order
    np.random.shuffle(selected_products)

    # --------------------------------
    # Generate interactions
    # --------------------------------

    for product_index in selected_products:

        interaction_type = np.random.choice(
            interaction_types,
            p=interaction_probabilities
        )

        # Dwell time
        dwell_time_ms = int(
            np.random.lognormal(
                mean=7.0,
                sigma=0.8
            )
        )

        # Keep dwell time realistic
        dwell_time_ms = min(
            max(dwell_time_ms, 500),
            120000
        )

        # Timestamp
        random_days = np.random.randint(0, 270)
        random_seconds = np.random.randint(0, 86400)

        timestamp = (
            start_date
            + timedelta(
                days=int(random_days),
                seconds=int(random_seconds)
            )
        )

        # Session
        session_id = f"{user_id}_session_{np.random.randint(1, 5)}"

        rows.append([
            str(uuid.uuid4()),
            user_id,
            str(product_ids[product_index]),
            session_id,
            interaction_type,
            timestamp,
            dwell_time_ms
        ])

    # Progress
    if user_num % 500 == 0:
        print(
            f"Generated {user_num:,}/{NUM_USERS:,} users "
            f"({user_num / NUM_USERS * 100:.0f}%)"
        )

# ==============================
# CREATE DATAFRAME
# ==============================

print("Creating DataFrame...")

df = pd.DataFrame(
    rows,
    columns=[
        "interaction_id",
        "user_id",
        "product_id",
        "session_id",
        "interaction_type",
        "timestamp",
        "dwell_time_ms"
    ]
)

# ==============================
# SORT
# ==============================

df = df.sort_values(
    ["user_id", "timestamp"]
).reset_index(drop=True)

# ==============================
# SAVE
# ==============================

print("Saving dataset...")

df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ==============================
# SUMMARY
# ==============================

print("\n================================")
print("DATASET CREATED SUCCESSFULLY")
print("================================")

print(f"Rows: {len(df):,}")
print(f"Users: {df['user_id'].nunique():,}")
print(f"Products interacted with: {df['product_id'].nunique():,}")
print(f"Sessions: {df['session_id'].nunique():,}")

print("\nInteraction distribution:")
print(df["interaction_type"].value_counts())

print("\nSaved as:")
print(OUTPUT_FILE)