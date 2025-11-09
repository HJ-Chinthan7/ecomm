import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Messsage from "../../components/Message";
import Loader from "../../components/Loader";
import {
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  useGetRazorpayKeyIdQuery,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "../../redux/api/orderApiSlice";

const Order = () => {
  const { id: orderId } = useParams();

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyRazorpayPayment] = useVerifyRazorpayPaymentMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] =
    useDeliverOrderMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: razorpayKey,
    isLoading: loadingRazorpay,
    error: errorRazorpay,
  } = useGetRazorpayKeyIdQuery();

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (!errorRazorpay && !loadingRazorpay && razorpayKey?.keyId) {
      const loadRazorpayScript = () => {
        if (window.Razorpay) {
          console.log('Razorpay already loaded');
          setRazorpayLoaded(true);
          return;
        }

        console.log('Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          setRazorpayLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay SDK');
          toast.error('Failed to load Razorpay SDK');
          setRazorpayLoaded(false);
        };
        document.body.appendChild(script);
      };

      if (order && !order.isPaid) {
        loadRazorpayScript();
      }
    } else if (errorRazorpay) {
      console.error('Razorpay key error:', errorRazorpay);
      setRazorpayLoaded(false);
    }
  }, [errorRazorpay, loadingRazorpay, order, razorpayKey]);

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded || !razorpayKey?.keyId) {
      toast.error('Razorpay is not loaded yet');
      return;
    }

    try {
      
      const razorpayOrderResponse = await createRazorpayOrder(orderId).unwrap();

      const options = {
        key: razorpayKey.keyId,
        amount: razorpayOrderResponse.amount,
        currency: razorpayOrderResponse.currency,
        name: 'Ecommerce Store',
        description: `Order ${order._id}`,
        order_id: razorpayOrderResponse.id,
        handler: async function (response) {
          try {
            
            await verifyRazorpayPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            refetch();
            toast.success("Payment successful! Order is paid");
          } catch (error) {
            toast.error(error?.data?.message || error.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
        },
        theme: {
          color: '#F37254'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error?.data?.message || error.message || 'Failed to create payment order');
    }
  };

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
              {loadingRazorpay ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader />
                  <p className="mt-2 text-sm text-gray-600">Loading payment configuration...</p>
                </div>
              ) : errorRazorpay ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-sm text-red-600">Failed to load payment configuration</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : !razorpayLoaded ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader />
                  <p className="mt-2 text-sm text-gray-600">Loading Razorpay...</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
                  >
                    Retry loading
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleRazorpayPayment}
                    className="bg-pink-500 text-white py-2 px-4 rounded-full text-lg w-full hover:bg-pink-600 transition-colors"
                  >
                    Pay with Razorpay
                  </button>
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
