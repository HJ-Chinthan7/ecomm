import express from "express";
const router = express.Router();

import {
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
  updateShippingAddress,
  getAllOrdersForTrack,
  getOrderById,
  updateOrderParcelId,
} from "../controllers/orderController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

router
  .route("/")
  .post(authenticate, createOrder)
  .get(authenticate, authorizeAdmin, getAllOrders);
router.route("/trackingcall-for-order").get(getAllOrdersForTrack);
router.route("/orderbyid/:orderId").get(getOrderById);
router.route("/order-parcelid-update/:orderId").patch(updateOrderParcelId);
router.route("/mine").get(authenticate, getUserOrders);
router.route("/total-orders").get(countTotalOrders);
router.route("/total-sales").get(calculateTotalSales);
router.route("/total-sales-by-date").get(calcualteTotalSalesByDate);
router.route("/:id").get(authenticate, findOrderById);
router.route("/:id/pay").put(authenticate, markOrderAsPaid);
router.route("/:id/create-razorpay-order").post(authenticate, createRazorpayOrder);
router.route("/:id/verify-razorpay-payment").post(authenticate, verifyRazorpayPayment);
router
  .route("/:id/deliver")
  .put(authenticate, authorizeAdmin, markOrderAsDelivered);

router
  .route("/:id/update-address")
  .put(authenticate, updateShippingAddress);

export default router;
