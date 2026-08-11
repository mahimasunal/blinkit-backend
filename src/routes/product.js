import { getProductsByCategoryId } from "../controllers/product/product.js";

import { Router } from "express";

const router = Router();

router.get("/product/:categoryId", getProductsByCategoryId);

export default router;
