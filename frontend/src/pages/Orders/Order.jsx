import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Messsage from "../../components/Message";
import Loader from "../../components/Loader";
import {
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  useGetPaypalClientIdQuery,
  usePayOrderMutation,
} from "../../redux/api/orderApiSlice";

const Order = () => {
  const { id: orderId } = useParams();

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] =
    useDeliverOrderMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  const {
    data: paypal,
    isLoading: loadingPaPal,
    error: errorPayPal,
  } = useGetPaypalClientIdQuery();

  useEffect(() => {
    if (!errorPayPal && !loadingPaPal && paypal.clientId) {
      const loadingPaPalScript = async () => {
        paypalDispatch({
          type: "resetOptions",
          value: {
            "client-id": paypal.clientId,
            currency: "USD",
          },
        });
        paypalDispatch({ type: "setLoadingStatus", value: "pending" });
      };

      if (order && !order.isPaid) {
        if (!window.paypal) {
          loadingPaPalScript();
        }
      }
    }
  }, [errorPayPal, loadingPaPal, order, paypal, paypalDispatch]);

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        await payOrder({ orderId, details });
        refetch();
        toast.success("Order is paid");
      } catch (error) {
        toast.error(error?.data?.message || error.message);
      }
    });
  }

  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [{ amount: { value: order.totalPrice } }],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onError(err) {
    toast.error(err.message);
  }

  const deliverHandler = async () => {
    await deliverOrder(orderId);
    refetch();
  };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Messsage variant="danger">{error.data.message}</Messsage>
  ) : (
    <div className="container mx-auto px-4 py-4 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          <div className="border border-gray-300 mt-5 pb-4 mb-5 rounded-lg p-4">
            {order.orderItems.length === 0 ? (
              <Messsage>Order is empty</Messsage>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="border-b-2">
                    <tr>
                      <th className="p-2 text-left">Image</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-center">Quantity</th>
                      <th className="p-2 text-center">Unit Price</th>
                      <th className="p-2 text-center">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.orderItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </td>

                        <td className="p-2">
                          <Link to={`/product/${item.product}`} className="text-blue-600 hover:underline">
                            {item.name}
                          </Link>
                        </td>

                        <td className="p-2 text-center">{item.qty}</td>
                        <td className="p-2 text-center">₹{item.price}</td>
                        <td className="p-2 text-center">
                          ₹{(item.qty * item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="mt-5 border border-gray-300 pb-4 mb-4 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Shipping</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-pink-500">Order:</strong> {order._id}
              </p>

              <p>
                <strong className="text-pink-500">Name:</strong>{" "}
                {order.user.username}
              </p>

              <p>
                <strong className="text-pink-500">Email:</strong> {order.user.email}
              </p>

              <p>
                <strong className="text-pink-500">Address:</strong>{" "}
                <span className="break-words">
                  {order.shippingAddress.address}, {order.shippingAddress.city}{" "}
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </span>
              </p>

              <p>
                <strong className="text-pink-500">Method:</strong>{" "}
                {order.paymentMethod}
              </p>

              {order.isPaid ? (
                <Messsage variant="success">Paid on {order.paidAt}</Messsage>
              ) : (
                <Messsage variant="danger">Not paid</Messsage>
              )}
            </div>
          </div>

          <div className="border border-gray-300 pb-4 mb-4 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Items</span>
                <span>₹{order.itemsPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{order.shippingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{order.taxPrice}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.totalPrice}</span>
              </div>
            </div>
          </div>

          {!order.isPaid && (
            <div className="border border-gray-300 pb-4 mb-4 rounded-lg p-4">
              {loadingPay && <Loader />}
              {isPending ? (
                <Loader />
              ) : (
                <div>
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                  ></PayPalButtons>
                </div>
              )}
            </div>
          )}

          {loadingDeliver && <Loader />}
          {userInfo && userInfo.isAdmin && order.isPaid && !order.isDelivered && (
            <div className="border border-gray-300 pb-4 mb-4 rounded-lg p-4">
              <button
                type="button"
                className="bg-pink-500 text-white w-full py-2 rounded hover:bg-pink-600 transition-colors"
                onClick={deliverHandler}
              >
                Mark As Delivered
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Order;
