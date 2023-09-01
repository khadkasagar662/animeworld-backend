const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

app.set("trust-proxy", true);
app.enable("trust-proxy");

const listrouter = require("./routes/list_router");
const authrouter = require("./routes/authrouter");
const profileRouter = require("./routes/user_profile_route");
const commentRouter = require("./routes/comment");

const errorHandler = require("./middleware/ErrorHandler");
const extra = require("./routes/user_extra");
const cacheControl = require("./middleware/CacheControl");

app.use(cors({
   origin: "http://localhost:3000",
   credentials: true,
  })
  );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cacheControl);
app.use("/public", express.static("public"));
app.use("/api/v1/auth", authrouter);
app.use("/user/:userID/profile/", profileRouter);
app.use("/user/:userID", listrouter);
app.use("/:malid/comment/", commentRouter);
app.use("/u/", extra);

app.get("/", (req, res) => {
  res.send("<h2>hello world</h2>");
});

app.post("/user/:userID/image", (req, res, next) => {
  console.log(req.files);
});

//* error handling middleware

app.use(errorHandler);

// const Port = process.env.PORT || 5000;
mongoose.set('strictQuery', true);

const startServer = async () => {
  try {
    mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: process.env.DB_NAME,
      })
      .then(() => {
        console.log("MongoDB connected");
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch (error) {
    console.log("database error");
  }
};
startServer();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
