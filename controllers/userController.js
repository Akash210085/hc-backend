const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const Appointment = require("../models/appointment");
const Slot = require("../models/slot");

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

  const new_appointment = await Appointment.create(newAppointment);
  console.log("new appointment is created", new_appointment);
  if (new_appointment) {
    res.status(200).json({
      status: "success",
      data: new_appointment,
      message: "New Appointment created successfully",
    });
  } else {
    res.status(400).json({
      status: "error",
      message: "Not Able to add appointment.Please try after some time",
    });
  }
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

exports.getSlot = async (req, res, next) => {
  const userId = req.user._id;
  console.log("userId", userId);
  const allSlots = await Slot.findOne({ id: userId });
  console.log(allSlots);
  res.status(200).json({
    status: "successfully fetched slotData",
    data: allSlots,
  });
};

exports.getAllSlots = async (req, res, next) => {
  const allSlotData = await Slot.find({});
  console.log("allSlotDtata:::", allSlotData);
  res.status(200).json({
    status: "successfully fetched slotData",
    data: allSlotData,
  });
};

exports.addSlot = async (req, res, next) => {
  const newSlot = req.body;

  console.log("hiii", newSlot);
  const existing_slot = await Slot.findOne({ id: req.body.id });
  if (existing_slot) {
    await Slot.findOneAndUpdate({ id: req.body.id }, newSlot, {
      new: true,
      validateModifiedOnly: true,
    });
    res.status(200).json({
      status: "success",
      data: existing_slot,
      message: "Slots updated successfully",
    });

    return;
  }
  const new_slot = await Slot.create(newSlot);
  console.log("new slot is created", new_slot);
  if (new_slot) {
    res.status(200).json({
      status: "success",
      data: new_slot,
      message: "New Slots created successfully",
    });
  } else {
    res.status(400).json({
      status: "error",
      message: "Not Able to add Slots.Please try after some time",
    });
  }
};
