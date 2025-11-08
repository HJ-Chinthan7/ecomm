import { useGetTopProductsQuery } from "../../redux/api/productApiSlice";
import Message from "../../components/Message";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import moment from "moment";
import {
  FaBox,
  FaClock,
  FaShoppingCart,
  FaStar,
  FaStore,
} from "react-icons/fa";

const ProductCarousel = () => {
  const { data: products, isLoading, error } = useGetTopProductsQuery();

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="mb-4 w-full">
      {isLoading ? null : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <Slider
          {...settings}
          className="w-full max-w-5xl mx-auto"
        >
          {products.map(
            ({
              image,
              _id,
              name,
              price,
              description,
              brand,
              createdAt,
              numReviews,
              rating,
              quantity,
              countInStock,
            }) => (
              <div key={_id} className="px-4">
                <img
                  src={image}
                  alt={name}
                  className="w-full rounded-lg object-cover h-64 sm:h-80 md:h-96 lg:h-[30rem]"
                />

                <div className="mt-4 flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{name}</h2>
                    <p className="text-lg sm:text-xl font-semibold">₹ {price}</p>
                    <br />
                    <p className="text-sm sm:text-base lg:text-lg w-full lg:w-96">
                      {description.substring(0, window.innerWidth < 1024 ? 100 : 170)} ...
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 lg:w-80">
                    <div className="flex flex-col gap-2">
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaStore className="mr-2 text-white" /> Brand: {brand}
                      </h1>
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaClock className="mr-2 text-white" /> Added: {moment(createdAt).fromNow()}
                      </h1>
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaStar className="mr-2 text-white" /> Reviews: {numReviews}
                      </h1>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaStar className="mr-2 text-white" /> Ratings: {Math.round(rating)}
                      </h1>
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaShoppingCart className="mr-2 text-white" /> Quantity: {quantity}
                      </h1>
                      <h1 className="flex items-center text-sm sm:text-base">
                        <FaBox className="mr-2 text-white" /> In Stock: {countInStock}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </Slider>
      )}
    </div>
  );
};

export default ProductCarousel;
