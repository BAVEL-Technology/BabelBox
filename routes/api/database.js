const router = require("express").Router();
const databaseController = require("../../controllers/dbController");
const multer = require("multer");
const auth = require("../../middleware/auth.js");
const upload = multer({
    dest: "uploads/" // "uploads"
});

// Browse or Add tables
// Matches with "/api/database"
router.route("/")
  .get(auth, databaseController.browse)
  .post(auth, databaseController.add)

//Read, Edit, or Destroy table
// Matches with "/api/database/:table"
router.route("/:table")
  .get(auth, databaseController.read)
  .put(auth, databaseController.edit)
  .delete(auth, databaseController.destroy)

  //Read, Edit, or Destroy prop of table
  // Matches with "/api/database/:table/:field"
  router.route("/:table/:field")
    .get(auth, databaseController.readField)
    .put(auth, databaseController.editField)
    .delete(auth, databaseController.destroyField)

  router.route("/:table/import")
    .post(auth, upload.single("file"), databaseController.importJSON)

module.exports = router;
