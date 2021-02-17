const router = require("express").Router();
const breadController = require("../../controllers/breadController");

// Browse or Add tables
// Matches with "/api/:bread"
router.route("/:bread")
  .get(breadController.browse)
  .post(breadController.add)

//Read, Edit, or Destroy table
// Matches with "/api/:bread/:id"
router.route("/:bread/:id")
  .get(breadController.read)
  .put(breadController.edit)
  .delete(breadController.destroy)

module.exports = router;
