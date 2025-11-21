import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import crypto from 'crypto';
import axios from "axios";
function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shippingPrice = itemsPrice > 500 ? 0 : 100;
  const taxRate = 0.18;
  const taxPrice = (itemsPrice * taxRate).toFixed(2);

  const totalPrice = (
    itemsPrice +
    shippingPrice +
    parseFloat(taxPrice)
  ).toFixed(2);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice,
    totalPrice,
  };
}

 const createRazorpayOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.isPaid) {
      return res.status(400).json({ error: "Order is already paid" });
    }

    const Razorpay = (await import("razorpay")).default;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(order.totalPrice * 100);

    if (amountInPaise > 10000000) {
      return res
        .status(400)
        .json({ error: "Amount exceeds maximum limit for Razorpay" });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${orderId}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: orderId,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: error.message });
  }
};


const verifyRazorpayPayment = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });


    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: 'completed',
    };

    const updatedOrder = await order.save();

    res.json({
      message: 'Payment verified successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
};
const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const normalizedItems = orderItems.map((item) => ({
      ...item,
      productId: item.product || item._id, 
    }));

    const itemsFromDB = await Product.find({
      _id: { $in: normalizedItems.map((x) => x.productId) },
    });

    const dbOrderItems = normalizedItems.map((clientItem) => {
      const productFromDB = itemsFromDB.find(
        (p) => p._id.toString() === clientItem.productId
      );

      if (!productFromDB) {
        throw new Error("Product not found: " + clientItem.productId);
      }

      return {
        name: clientItem.name || productFromDB.name,
        qty: clientItem.qty,
        image: clientItem.image || productFromDB.image,
        price: productFromDB.price,
        product: productFromDB._id,
      };
    });
    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calcPrices(dbOrderItems);

    const order = new Order({
      orderItems: dbOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      parcelId: null,
      isDispatched: false,
      isPaid: false,
      paidAt: null,
      isDelivered: false,
      deliveredAt: null,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({  }).populate("user", "id username");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderParcelId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { parcelId } = req.body;
    if (!parcelId) {
      return res.status(400).json({ message: "parcelId is required" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { parcelId },
      { new: true }
    ).populate("user", "id username");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Parcel ID updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    let order = await Order.findById(orderId)
      .populate("user", "_id username");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
res.json({order});

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllOrdersForTrack = async (req, res) => {
  try {
    const orders = await Order.find({parcelId: null}).populate("user", "id username ");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    console.log(orders);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const countTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    res.json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateTotalSales = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    res.json({ totalSales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calcualteTotalSalesByDate = async (req, res) => {
  try {
    const salesByDate = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.json(salesByDate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findOrderById = async (req, res) => {
  
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "username email"
    );

    let parcelData = null;

     if (order.parcelId) {
      try {
        
        const response = await axios.get(
          `https://ecommerce-delivery-tracking.onrender.com/api/assigner/parcels/${order.parcelId}`
        );
        parcelData = response.data;
      } catch (err) {
        console.log("Parcel fetch failed:", err.message);
      }
    }
    
    if (order) {
    res.json({
      order,
      parcel: parcelData, 
    });
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id || req.body.razorpay_payment_id,
        status: req.body.status || 'completed',
        update_time: req.body.update_time || new Date().toISOString(),
        email_address: req.body.payer?.email_address || req.body.email || '',
      };

      const updateOrder = await order.save();
      res.status(200).json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateShippingAddressBoth = async (req, res) => {
  const orderId = req.params.id;
  const newAddress = req.body;
  let updatedParcel = null;
  let parcelUpdated = false;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const parcelId = order.parcelId;

    if (parcelId) {
      try {
        const parcelRes = await axios.get(
          `${process.env.TRACKING_BACKEND_URL}/api/assigner/parcels/${parcelId}`
        );

        const parcelData = parcelRes.data;

        const updatedParcelPayload = {
          ...parcelData,
          shippingAddress: {
            ...parcelData.shippingAddress,
            ...newAddress,
          },
          isAddressChanged: true,
        };

        const savedParcel = await axios.put(
          `${process.env.TRACKING_BACKEND_URL}/api/assigner/update-address/${parcelId}`,
          updatedParcelPayload
        );

        updatedParcel = savedParcel.data;
        parcelUpdated = true;

      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Parcel update failed. Order NOT updated.",
          error: err.message
        });
      }
    }

    const oldOrderAddress = { ...order.shippingAddress };

    try {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...newAddress,
      };

      await order.save();
    } catch (orderErr) {

      if (parcelUpdated && parcelId) {
        try {
          await axios.put(
            `${process.env.TRACKING_BACKEND_URL}/api/assigner/update-address/${parcelId}`,
            {
              ...updatedParcel,
              shippingAddress: oldOrderAddress,
              isAddressChanged: false
            }
          );
        } catch (rollbackErr) {
          console.log("ROLLBACK FAILED!", rollbackErr.message);
        }
      }

      return res.status(500).json({
        success: false,
        message: "Order update failed. Parcel changes rolled back.",
        error: orderErr.message
      });
    }

    return res.json({
      success: true,
      message: "Shipping address updated in both Order and Parcel",
      order,
      parcelUpdated,
      parcel: updatedParcel,
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};


const markOrderDeliveredByOrderId = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId missing" });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.isDelivered = true;
  order.deliveredAt = new Date();

  await order.save();

  res.json({
    success: true,
    message: "Order delivery updated",
    order,
  })
};

export {
  markOrderDeliveredByOrderId,
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getAllOrdersForTrack,
  getOrderById,
  updateOrderParcelId,
  updateShippingAddressBoth,
};
