const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const Appointment = require("../models/appointment");

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

  console.log("hiii", newAppointment);

  const new_user = await Appointment.create(newAppointment);
  console.log("new appointment is created", new_user);
};

exports.getMe = async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
};

exports.getAppointments = async (req, res, next) => {
  const userId = req.user._id;
  console.log("userId", userId);
  const allAppointments = await Appointment.find({ from: userId });
  console.log(allAppointments);
  res.status(200).json({
    status: "success",
    data: allAppointments,
  });
};
