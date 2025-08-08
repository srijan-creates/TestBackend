const express = require("express");
const app = express();
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config();

// cros error
const cors = require("cors");
const connectDb = require("./config/dbConnect");
const userRoutes = require("./routes/userRoutes");
const blogRoutes = require("./routes/blogRoutes");
const cloudinaryConfig = require("./config/cloudinaryConfig");
app.use(cors());
app.use(express.json());

// api versioning in express
app.use("/api/v1/", userRoutes);
app.use("/api/v1/", blogRoutes);

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Connect Sucessfully" });
});
app.listen(4000, () => {
  console.log("server started");
  connectDb();
  cloudinaryConfig();
});
