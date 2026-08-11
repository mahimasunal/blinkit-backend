import { getAllCategories } from "../controllers/product/category.js";

import { Router } from "express";

const router = Router();

router.get("/category", getAllCategories);

export default router;
