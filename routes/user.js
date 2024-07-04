const router = require("express").Router();
const multer = require("multer");
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
// console.log(upload);
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
// const upload = require("../server");

router.patch("/update-me", authController.protect, userController.updateMe);
// router.patch(
//   "/dashboard/:id",
//   authController.protect,
//   userController.approveRejectAppointment
// );
// router.post(
//   "/dashboard",
//   authController.protect,
//   userController.addAppointment
// );

router.post("/profile", authController.protect, userController.addSlot);
router.post(
  "/chats/add-friend",
  authController.protect,
  userController.addFriend
);
router.post(
  "/profile/certificate",
  upload.single("file"),
  authController.protect,
  userController.submitCertificate
);
router.get("/get-me", authController.protect, userController.getMe);
router.get(
  "/get-all-users",
  authController.protect,
  userController.getAllUsers
);
router.get("/profile", authController.protect, userController.getSlot);
router.get(
  "/get-appointments",
  authController.protect,
  userController.getAppointments
);
router.get("/get-allSlots", authController.protect, userController.getAllSlots);
module.exports = router;
