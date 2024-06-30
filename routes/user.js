const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.patch("/update-me", authController.protect, userController.updateMe);
router.post(
  "/dashboard",
  authController.protect,
  userController.addAppointment
);
router.get("/get-me", authController.protect, userController.getMe);
router.get(
  "/get-appointments",
  authController.protect,
  userController.getAppointments
);
module.exports = router;
