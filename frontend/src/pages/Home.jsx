import { Link, useParams } from "react-router-dom";
import { useGetProductsQuery } from "../redux/api/productApiSlice";
import Loader from "../components/Loader";
import Message from "../components/Message";
import Header from "../components/Header";
import Product from "./Products/Product";

const Home = () => {
  const { keyword } = useParams();
  const { data, isLoading, isError } = useGetProductsQuery({ keyword });

  return (
    <>
      {!keyword ? <Header /> : null}
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <Message variant="danger">
          {isError?.data?.message || isError.error}
        </Message>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row justify-between items-center px-4 lg:px-0">
            <h1 className="text-2xl lg:text-4xl xl:text-5xl mt-8 lg:mt-40 lg:ml-80 xl:ml-80 text-center lg:text-left">
              Welcome to ecomm
            </h1>

            <Link
              to="/shop"
              className="bg-pink-600 font-bold rounded-full py-2 px-6 lg:px-10 mt-4 lg:mt-40 lg:mr-72 xl:mr-72 text-center"
            >
              Shop
            </Link>
          </div>

          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8 px-4 lg:px-0">
              {data.products.map((product) => (
                <div key={product._id} className="flex justify-center">
                  <Product product={product} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Home;
