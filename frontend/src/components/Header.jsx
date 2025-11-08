import { useGetTopProductsQuery } from "../redux/api/productApiSlice";
import Loader from "./Loader";
import SmallProduct from "../pages/Products/SmallProduct";
import ProductCarousel from "../pages/Products/ProductCarousel";

const Header = () => {
  const { data, isLoading, error } = useGetTopProductsQuery();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <h1>ERROR</h1>;
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 items-start px-4 lg:px-0">
        {/* small product previews shown on large screens */}
        <div className="hidden lg:block w-full lg:w-1/4 xl:w-1/4">
          <div className="grid grid-cols-1 gap-3">
            {data.map((product) => (
              <div key={product._id}>
                <SmallProduct product={product} />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-3/4 xl:w-3/4">
          <ProductCarousel />
        </div>
      </div>
    </>
  );
};

export default Header;
