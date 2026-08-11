import { getAllBranches, getBranchById } from "../controllers/branch/branch.js";

import { Router } from "express";

const router = Router();

router.get("/branch", getAllBranches);
router.get("/branch/:branchId", getBranchById);

export default router;
