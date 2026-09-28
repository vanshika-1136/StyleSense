import pandas as pd

print("Loading datasets...")

products = pd.read_csv("stylesense_products_100k.csv")
# interactions = pd.read_csv("interactions_clean.csv")
interactions = pd.read_csv("stylesense_interactions.csv")

# Convert IDs to strings so comparison is consistent
products["id"] = products["id"].astype(str)
interactions["product_id"] = interactions["product_id"].astype(str)

# Find products referenced by interactions
interaction_products = set(interactions["product_id"])

# Find products available in catalog
catalog_products = set(products["id"])

# Products referenced by interactions but missing from catalog
missing_products = interaction_products - catalog_products

print("\n========================================")
print("DATA VALIDATION")
print("========================================")

print("Total products:", len(products))
print("Total interactions:", len(interactions))

print("Unique interaction products:",
      len(interaction_products))

print("Missing product IDs:",
      len(missing_products))

print("Matching product IDs:",
      len(interaction_products & catalog_products))

if len(missing_products) == 0:
    print("\n✅ All interaction products exist in product catalog.")
else:
    print("\n⚠️ Some interaction products are missing.")

    print("\nFirst 20 missing IDs:")
    print(list(missing_products)[:20])