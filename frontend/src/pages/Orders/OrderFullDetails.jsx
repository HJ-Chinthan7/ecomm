import { useParams,Link } from "react-router-dom";
import { useGetOrderDetailsQuery, useUpdateShippingAddressMutation } from "../../redux/api/orderApiSlice";
import { useState } from "react";

const OrderFullDetails = () => {
  const { id } = useParams();
  const { data: order, isLoading } = useGetOrderDetailsQuery(id);
  const [updateAddress] = useUpdateShippingAddressMutation();
  

  const [form, setForm] = useState({
    address: "",
    city: "",
    district: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    await updateAddress({ orderId: id, shippingAddress: form });
    alert("Address updated!");
  };
  if (isLoading) return <p>Loading...</p>;
  const trackingLink =
   order?.order?.parcelId&&order?.parcel?.busId
      ? `https://real-time-trackingofbuses.netlify.app/track/${order?.parcel?.busId}`
      : null;

  return (
    <div className="container mx-auto p-4 space-y-4">

      <h1 className="text-2xl font-bold">Order Details</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        {order?.order?.orderItems.map((item) => (
          <div key={item._id} className="flex items-center gap-4 border p-3 rounded mb-2">
            <img src={item.image} className="w-20" />
            <div>
              <p className="font-semibold">{item.name}</p>
              <p>Qty: {item.qty}</p>
              <p className="font-bold">₹ {item.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <p>{order.order.shippingAddress.address}</p>
        <p>
          {order.order.shippingAddress.city}, {order.order.shippingAddress.district},{" "}
          {order.order.shippingAddress.state}
        </p>
        <p>{order.order.shippingAddress.postalCode}</p>
        <p>{order.order.shippingAddress.country}</p>
      </div>

      {order.parcelId ? (
        <div>
          <p className="text-lg font-semibold">Tracking ID:</p>
          <p>{order?.parcel?.busId}</p>

          {trackingLink && (
            <Link
              to={trackingLink}
              className="text-blue-500 underline"
              target="_blank"
            >
              Track Package
            </Link>
          )}
        </div>
      ) : (
        <p>Package not yet dispatched</p>
      )}

      <div className="border p-4 rounded mt-4">
        <h2 className="text-xl font-bold mb-3">Update Address</h2>

        {Object.keys(form).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field}
            className="border p-2 w-full rounded mb-2"
            onChange={handleChange}
          />
        ))}

        <button
          onClick={handleUpdate}
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          Update Address
        </button>
      </div>
    </div>
  );
};

export default OrderFullDetails;
