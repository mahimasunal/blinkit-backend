import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
     },
})

const Product = mongoose.model("Product", productSchema);

export default Product;

