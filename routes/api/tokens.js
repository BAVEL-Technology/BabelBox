const router = require("express").Router();
const tokensController = require("../../controllers/tokensController");

// Matches with "/api/r/tokens"
router.route("/")
  .put(tokensController.read)
  .post(tokensController.create)

module.exports = router;
