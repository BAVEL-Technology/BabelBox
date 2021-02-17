const router = require("express").Router();
const databaseController = require("../../controllers/dbController");
const multer = require("multer");
const upload = multer({
    dest: "uploads/" // "uploads"
});

// Browse or Add tables
// Matches with "/api/database"
router.route("/")
  .get(databaseController.browse)
  .post(databaseController.add)

//Read, Edit, or Destroy table
// Matches with "/api/database/:table"
router.route("/:table")
  .get(databaseController.read)
  .put(databaseController.edit)
  .delete(databaseController.destroy)

  //Read, Edit, or Destroy prop of table
  // Matches with "/api/database/:table/:field"
  router.route("/:table/:field")
    .get(databaseController.readField)
    .put(databaseController.editField)
    .delete(databaseController.destroyField)

  router.route("/:table/import")
    .post(upload.single("filename"), databaseController.importJSON)

module.exports = router;
