const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.patch("/update-me", authController.protect, userController.updateMe);
router.patch(
  "/dashboard/:id",
  authController.protect,
  userController.approveRejectAppointment
);
// router.post(
//   "/dashboard",
//   authController.protect,
//   userController.addAppointment
// );
router.post("/profile", authController.protect, userController.addSlot);
router.get("/get-me", authController.protect, userController.getMe);
router.get("/profile", authController.protect, userController.getSlot);
router.get(
  "/get-appointments",
  authController.protect,
  userController.getAppointments
);
router.get("/get-allSlots", authController.protect, userController.getAllSlots);
module.exports = router;
