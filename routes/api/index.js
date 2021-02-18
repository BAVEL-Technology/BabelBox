const router = require("express").Router();
const adminRoutes = require("./admins");
const databaseRoutes = require("./database");
const breadRoutes = require("./bread");

// Database routes
router.use("/database", databaseRoutes);

// User routes
router.use("/r/admins", adminRoutes);

// Bread routes
router.use("/", breadRoutes);

module.exports = router;
