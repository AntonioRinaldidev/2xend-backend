const express = require("express");
const cors = require("cors");
const authRoute = require("./src/routes/authRoutes");
const userRoute = require("./src/routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);

app.get("/", (req, res) => {
  res.send("2xend Backend is running");
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
