import pandas as pd

#Creates stylesense_products_100k.csv from the original product dataset

print("Loading cleaned dataset...")

df = pd.read_csv("stylesense_products.csv")

print("Original shape:", df.shape)

# Remove products with missing essential information
df = df.dropna(subset=["id", "name", "price"])

# Remove invalid prices
df = df[df["price"] > 0]

# Remove duplicate product IDs
df = df.drop_duplicates(subset=["id"])

# Randomly select 100,000 products
df_mvp = df.sample(
    n=min(100000, len(df)),
    random_state=42
)

# Sort by product ID
df_mvp = df_mvp.sort_values("id")

# Save MVP dataset
df_mvp.to_csv("stylesense_products_100k.csv", index=False)

print("\n========================================")
print("MVP DATASET CREATED")
print("========================================")

print("Final shape:", df_mvp.shape)

print("\nCategory distribution:")
print(df_mvp["category"].value_counts().head(20))

print("\nGender distribution:")
print(df_mvp["gender"].value_counts())

print("\nColor distribution:")
print(df_mvp["color"].value_counts())

print("\nSaved as:")
print("stylesense_products_100k.csv")