/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import HeartIcon from "./HeartIcon";

const Product = ({ product }) => {
  return (
    <div className="w-full max-w-sm p-3">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 object-cover rounded"
        />
        <HeartIcon product={product} />
      </div>

      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h2 className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm sm:text-base lg:text-lg truncate">{product.name}</div>
            <span className="bg-pink-100 text-pink-800 text-xs sm:text-sm font-medium px-2.5 py-0.5 rounded-full mt-1 sm:mt-0">
              ₹ {product.price}
            </span>
          </h2>
        </Link>
      </div>
    </div>
  );
};

export default Product;
