const router = require("express").Router();
const adminRoutes = require("./admins");
const databaseRoutes = require("./database");
const breadRoutes = require("./bread");
const tokenRoutes = require("./tokens")

// Database routes
router.use("/database", databaseRoutes);

// Admin routes
router.use("/r/admins", adminRoutes);

// Token routes
router.use("/r/tokens", tokenRoutes);


// Bread routes
router.use("/", breadRoutes);

module.exports = router;
