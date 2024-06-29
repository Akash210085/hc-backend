const User = require("../models/user");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avatar"
  );

  const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody);

  res.status(200).json({
    status: "success",
    data: userDoc,
    message: "User Updated successfully",
  });
};

exports.addAppointment = async (req, res, next) => {
  const newAppointment = req.body;

  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(userId, {
    $push: { appointmentList: newAppointment },
  });
};

exports.getMe = async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
};
