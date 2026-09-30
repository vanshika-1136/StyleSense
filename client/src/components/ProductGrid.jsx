import ProductCard from './ProductCard';

function ProductGrid({ products = [], onInteraction, userInteractions = [] }) {
  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-5
      "
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          userInteractions={userInteractions}
          onInteraction={onInteraction}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
