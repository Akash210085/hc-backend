const router = require("express").Router();

const authRoute = require("./auth");
const userRoute = require("./user");

router.use("/auth", authRoute);
router.use("/hc", userRoute);

module.exports = router;
