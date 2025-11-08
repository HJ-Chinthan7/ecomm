import { Link } from "react-router-dom";
import HeartIcon from "./HeartIcon";

const SmallProduct = ({ product }) => {
  return (
    <div className="w-full max-w-xs ml-4 lg:ml-8 p-3">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-auto rounded object-cover"
        />
        <HeartIcon product={product} />
      </div>

      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h2 className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm sm:text-base truncate">{product.name}</div>
            <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300 mt-1 sm:mt-0">
              ₹{product.price}
            </span>
          </h2>
        </Link>
      </div>
    </div>
  );
};

export default SmallProduct;
