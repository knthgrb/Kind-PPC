import Image from "next/image";

type Category = {
  name: string;
  image: string;
  description: string;
};

type BrowseCategoriesProps = {
  categories: Category[];
};

export default function BrowseCategories({
  categories,
}: BrowseCategoriesProps) {
  return (
    <section className="bg-white">
      <div
        className="
          max-w-[1100px] bg-white mx-auto 
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
          gap-[40px] px-4 
          justify-items-center
        "
      >
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex items-center p-4 rounded-2xl bg-white border border-[#E6E7E9] hover:border-gray-400 w-[330px] h-[130px] transition-all"
          >
            <div className="mr-4">
              <Image
                src={category.image}
                alt={category.name}
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="browseH3 mb-2">{category.name}</h3>
              <p className="browseP text-gray-600 pr-10">
                {category.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
