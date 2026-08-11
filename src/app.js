import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import userRouter from "./routes/auth.js";
import categoryRouter from "./routes/category.js";
import productRouter from "./routes/product.js";
import orderRouter from "./routes/order.js";
import branchRouter from "./routes/branch.js";
import { adminJs, adminRouter } from "./config/admin.js";

const app = express();

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New client connected: ", socket.id);

  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`Socket ${socket.id} joined room for order ${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use(adminJs.options.rootPath, adminRouter);

app.use("/api/auth", userRouter);
app.use("/api", categoryRouter);
app.use("/api", productRouter);
app.use("/api", orderRouter);
app.use("/api", branchRouter);

export { app, server };
