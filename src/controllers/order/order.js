import Order from "../../schemas/order.js";
import Branch from "../../schemas/branch.js";
import { Customer, DeliveryPartner } from "../../schemas/user.js";
import { io } from "../../app.js";

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;

    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return res.status(404).send({ message: "Customer not found" });
    }

    if (!branchData) {
      return res.status(404).send({ message: "Branch not found" });
    }

    // TODO: once frontend starts sending the customer's live location with
    // the order-create request, prefer that here and fall back to
    // customerData.liveLocation, then finally to this default.
    const DEFAULT_DELIVERY_LOCATION = {
      latitude: 28.6139, // New Delhi, used as a placeholder until real location is wired up
      longitude: 77.209,
    };

    const newOrder = new Order({
      customer: userId,
      items: items.map((item) => ({
        item: item.item,
        count: item.count,
      })),
      branch,
      totalPrice,
      deliveryLocation: {
        latitude:
          customerData.liveLocation?.latitude ??
          DEFAULT_DELIVERY_LOCATION.latitude,
        longitude:
          customerData.liveLocation?.longitude ??
          DEFAULT_DELIVERY_LOCATION.longitude,
        address: customerData.address || "No address available",
      },
      pickupLocation: {
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        address: branchData.address || "No address available",
      },
    });

    const savedOrder = await newOrder.save();
    return res
      .status(201)
      .send({ message: "Order created successfully", order: savedOrder });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).send({ message: "Failed to create order", error });
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    const { deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery partner not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.status !== "available") {
      return res.status(400).send({ message: "Order is not available" });
    }

    order.status = "confirmed";
    order.deliveryPartner = userId;
    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation?.latitude,
      longitude: deliveryPersonLocation?.longitude,
      address: deliveryPersonLocation?.address || "No address available",
    };

    await order.save();
    io.to(orderId).emit("orderConfirmed", order);

    return res.json(order);
  } catch (error) {
    console.error("Confirm order error:", error);
    return res.status(500).send({ message: "Failed to confirm order", error });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;
    const { userId } = req.user;

    const deliveryPerson = await DeliveryPartner.findById(userId);

    if (!deliveryPerson) {
      return res.status(404).send({ message: "Delivery partner not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (["cancelled", "delivered"].includes(order.status)) {
      return res.status(400).send({ message: "Order is already completed" });
    }

    if (order.deliveryPartner.toString() !== userId) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    order.status = status;
    order.deliveryPersonLocation = deliveryPersonLocation;
    await order.save();
    io.to(orderId).emit("liveTrackingUpdates", order);

    return res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).send({ message: "Failed to update order status", error });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (deliveryPartnerId) {
      query.deliveryPartner = deliveryPartnerId;
    }

    if (branchId) {
      query.branch = branchId;
    }

    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner",
    );
    return res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).send({ message: "Failed to get orders", error });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate(
      "customer branch items.item deliveryPartner",
    );
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).send({ message: "Failed to get order", error });
  }
};
