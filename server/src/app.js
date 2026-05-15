const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const noteRoutes = require("./routes/noteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const parentRoutes = require("./routes/parentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api", noteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/parents", parentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
