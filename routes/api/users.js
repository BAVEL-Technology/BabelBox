const router = require("express").Router();
const userController = require("../../controllers/userController");
const auth = require("../../middleware/auth.js");

// Matches with "/api/users"
router.route("/")
  .get(auth, userController.currentUser)
  .post(userController.create);

// Matches with "/api/users/:id"
router.route("/:id")
  .get(userController.read)
  .put(userController.update)
  .delete(userController.destroy);

// Matches with "/api/users/login"
router.route("/login")
  .post(userController.login);

// Matches with "/api/users/logout"
router.route("/logout")
  .post(userController.logout);

module.exports = router;
