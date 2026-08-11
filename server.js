import dotenv from "dotenv";
dotenv.config();
import { server } from "./src/app.js";
import connectDB from "./src/dbConnet/Connection.js";

const port = process.env.PORT || 3000;
connectDB().then(() => {
  server.listen(port, () => console.log(`Server is running on port ${port}`));
});
