const router = require("express").Router();
const userRoutes = require("./users");
const databaseRoutes = require("./database");
const breadRoutes = require("./bread");

// Database routes
router.use("/database", databaseRoutes);

// User routes
router.use("/users", userRoutes);

// Bread routes
router.use("/", breadRoutes);

module.exports = router;
