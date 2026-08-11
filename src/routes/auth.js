import {
  fetchUser,
  loginCustomer,
  loginDeliveryPartner,
  refreshToken,
} from "../controllers/auth/auth.js";

import { updateUser } from "../controllers/tracking/user.js";

import { verifyToken } from "../middleware/auth.js";

import { Router } from "express";

const router = Router();

router.post("/customer/login", loginCustomer);
router.post("/delivery/login", loginDeliveryPartner);
router.post("/refresh-token", refreshToken);
router.get("/user", verifyToken, fetchUser);
router.put("/user", verifyToken, updateUser);

export default router;