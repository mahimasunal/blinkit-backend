import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String },
  role: { type: String, enum: ["Customer"], default: "Customer" },
  isActivated: { type: Boolean, default: false },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
});

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String },
  role: { type: String, enum: ["DeliveryPartner"], default: "DeliveryPartner" },
  isActivated: { type: Boolean, default: false },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
});

const adminSchema = new mongoose.Schema({
  name: { type: String },
  role: { type: String, enum: ["Admin"], default: "Admin" },
  isActivated: { type: Boolean, default: false },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const Customer = mongoose.model("Customer", customerSchema);
export const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export const Admin = mongoose.model("Admin", adminSchema);
