const router = require("express").Router();
const breadController = require("../../controllers/breadController");

// Browse, Edit, Destory or Add tables
// Matches with "/api/:bread"
router.route("/:bread")
  .get(breadController.browse)
  .put(breadController.edit)
  .post(breadController.add)
  .delete(breadController.destroy)

router.route("/push/:bread")
  .put(breadController.push)

module.exports = router;
