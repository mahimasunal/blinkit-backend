import {
  confirmOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../controllers/order/order.js";

import { verifyToken } from "../middleware/auth.js";

import { Router } from "express";

const router = Router();

router.post("/order", verifyToken, createOrder);
router.get("/order", getOrders);
router.patch("/order/:orderId", verifyToken, updateOrderStatus);
router.post("/order/:orderId/confirm", verifyToken, confirmOrder);
router.get("/order/:orderId", getOrderById);

export default router;