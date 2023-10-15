var express = require("express");
var app = express();
var router = express.Router();
var HomeController = require("../controllers/HomeController");
var UserController = require("../controllers/UserController");
var AdminAuth = require("../middleware/AdminAuth");

const multer = require("multer");
const upload = multer().none();

router.get("/", HomeController.index);
router.post("/user", UserController.create);
router.get("/user", AdminAuth, UserController.index);
router.get("/user/:id", AdminAuth, UserController.findUser);

router.delete("/user/:id", AdminAuth, UserController.remove);

router.post("/recoverpassword", UserController.recoverPassword);
router.post("/changepassword", UserController.changePassword);
router.post("/login", UserController.login);
router.post("/validate", AdminAuth, HomeController.validate);

// router.put("/user", AdminAuth, UserController.edit);
// router.put("/user", AdminAuth, upload, UserController.edit);
router.put(
  "/user",
  UserController.upload.single("profilePicture"),
  UserController.edit
);

// router.put("/user", this.upload.single("profilePicture"), UserController.edit);
module.exports = router;
