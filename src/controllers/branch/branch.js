import Branch from "../../schemas/branch.js";

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    return res.send(branches);
  } catch (error) {
    console.error("Get branches error:", error);
    return res.status(500).send({ message: "An error occurred", error });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const { branchId } = req.params;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).send({ message: "Branch not found" });
    }
    return res.send(branch);
  } catch (error) {
    console.error("Get branch by ID error:", error);
    return res.status(500).send({ message: "An error occurred", error });
  }
};
