const express = require("express");
const cors = require("cors");
const authRoute = require("./src/routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoute);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
