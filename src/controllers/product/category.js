import Category from "../../schemas/category.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.send(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).send({ message: "An error occurred", error });
  }
};
