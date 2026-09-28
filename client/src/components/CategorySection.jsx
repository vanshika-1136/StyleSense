const categories = [
  {
    name: 'Dresses',
    emoji: '👗',
  },
  {
    name: 'Sneakers',
    emoji: '👟',
  },
  {
    name: 'Hoodies',
    emoji: '🧥',
  },
  {
    name: 'Jeans',
    emoji: '👖',
  },
  {
    name: 'T-Shirts',
    emoji: '👕',
  },
];

function CategorySection({ onCategoryClick }) {
  return (
    <section
      className="
            max-w-7xl
            mx-auto
            px-6
            py-14
        "
    >
      <div className="mb-7">
        <p
          className="
                    text-sm
                    text-gray-400
                    uppercase
                    tracking-widest
                "
        >
          Explore
        </p>

        <h2
          className="
                    text-2xl
                    font-bold
                    mt-1
                "
        >
          Shop by category
        </h2>
      </div>

      <div
        className="
                grid
                grid-cols-2
                md:grid-cols-5
                gap-4
            "
      >
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategoryClick(category.name)}
            className="
                            group
                            p-6
                            rounded-2xl
                            bg-white
                            border
                            border-gray-100
                            text-left
                            hover:bg-black
                            hover:text-white
                            hover:-translate-y-1
                            hover:shadow-xl
                            transition-all
                            duration-300
                        "
          >
            <div
              className="
                            text-4xl
                            mb-5
                            group-hover:scale-110
                            transition
                        "
            >
              {category.emoji}
            </div>

            <h3 className="font-semibold">{category.name}</h3>

            <p
              className="
                            text-xs
                            text-gray-400
                            group-hover:text-gray-500
                            mt-1
                        "
            >
              Explore styles →
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
