import pandas as pd

print("Loading interactions dataset...")

df = pd.read_csv("interactions.csv")

print("Original shape:", df.shape)

# --------------------------------------------------
# 1. Remove duplicate interaction IDs
# --------------------------------------------------

df = df.drop_duplicates(subset=["interaction_id"])

# --------------------------------------------------
# 2. Convert timestamp to datetime
# --------------------------------------------------

df["timestamp"] = pd.to_datetime(
    df["timestamp"],
    errors="coerce"
)

# Remove invalid timestamps
df = df.dropna(subset=["timestamp"])

# --------------------------------------------------
# 3. Clean dwell time
# --------------------------------------------------

df["dwell_time_ms"] = pd.to_numeric(
    df["dwell_time_ms"],
    errors="coerce"
)

df["dwell_time_ms"] = df["dwell_time_ms"].fillna(0)

# Prevent negative dwell times
df["dwell_time_ms"] = df["dwell_time_ms"].clip(lower=0)

# --------------------------------------------------
# 4. Interaction weights
# --------------------------------------------------

interaction_weights = {
    "view": 1,
    "click": 2,
    "add_to_wishlist": 5,
    "add_to_cart": 7,
    "remove_from_wishlist": -4,
    "remove_from_cart": -5
}

df["interaction_weight"] = (
    df["interaction_type"]
    .map(interaction_weights)
    .fillna(0)
)

# --------------------------------------------------
# 5. Convert dwell time from milliseconds to seconds
# --------------------------------------------------

df["dwell_time_sec"] = df["dwell_time_ms"] / 1000

# --------------------------------------------------
# 6. Dwell-time bonus
# --------------------------------------------------

def calculate_dwell_bonus(seconds):

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


df["dwell_bonus"] = df["dwell_time_sec"].apply(
    calculate_dwell_bonus
)

# --------------------------------------------------
# 7. Final behavior score
# --------------------------------------------------

df["behavior_score"] = (
    df["interaction_weight"] +
    df["dwell_bonus"]
)

# --------------------------------------------------
# 8. Select final columns
# --------------------------------------------------

df = df[
    [
        "interaction_id",
        "user_id",
        "product_id",
        "session_id",
        "interaction_type",
        "timestamp",
        "dwell_time_ms",
        "dwell_time_sec",
        "interaction_weight",
        "dwell_bonus",
        "behavior_score"
    ]
]

# --------------------------------------------------
# 9. Save
# --------------------------------------------------

df.to_csv(
    "interactions_clean.csv",
    index=False
)

# --------------------------------------------------
# 10. Display results
# --------------------------------------------------

print("\n========================================")
print("INTERACTION DATASET CREATED")
print("========================================")

print("Final shape:", df.shape)

print("\nInteraction types:")
print(df["interaction_type"].value_counts())

print("\nBehavior score distribution:")
print(df["behavior_score"].describe())

print("\nSample:")
print(df.head())

print("\nSaved as:")
print("interactions_clean.csv")