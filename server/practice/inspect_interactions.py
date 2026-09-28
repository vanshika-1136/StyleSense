import pandas as pd

df = pd.read_csv("interactions.csv")

print("Shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nData types:")
print(df.dtypes)

print("\nMissing values:")
print(df.isna().sum())

print("\nInteraction types:")
print(df["interaction_type"].value_counts())

print("\nSample:")
print(df.head())

print("\nUnique users:", df["user_id"].nunique())
print("Unique products:", df["product_id"].nunique())
print("Unique sessions:", df["session_id"].nunique())