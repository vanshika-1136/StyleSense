import pandas as pd

df = pd.read_csv("stylesense_products_100k.csv")

print("Before:", len(df))

df = df[
    df["image_url"].notna() &
    (df["image_url"].str.strip() != "-") &
    (df["image_url"].str.strip() != "")
]

print("After:", len(df))
print("Removed:", 100000 - len(df))

df.to_csv("stylesense_products_clean.csv", index=False)