const router = require("express").Router();
const adminsController = require("../../controllers/adminsController");
const auth = require("../../middleware/auth.js");

// Matches with "/api/r/admins"
router.route("/")
  .get(auth, adminsController.currentAdmin)
  .post(adminsController.create);

// Matches with "/api/r/admins/:id"
router.route("/:id")
  .get(adminsController.read)
  .put(adminsController.update)
  .delete(adminsController.destroy);

// Matches with "/api/r/admins/login"
router.route("/login")
  .post(adminsController.login);

// Matches with "/api/r/admins/logout"
router.route("/logout")
  .post(adminsController.logout);

module.exports = router;
