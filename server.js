// API
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models/index.model");
const api = require("./routes/api");
const cors = require("cors");

const app = express();

// parse requests of content-type - application/json
app.use(bodyParser.json());

// enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// load models and connect to database
db.sequelize
  .sync()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

// load routes
app.use(
  "/api",
  (req, res, next) => {
    next();
  },
  api
);

// Membuat direktori statis untuk file gambar
app.use("/uploads", express.static("uploads"));

// start server
app.listen(9001, () => {
  console.log("Server is running on port 9001");
});
