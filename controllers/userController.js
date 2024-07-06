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

// exports.addAppointment = async (req, res, next) => {
//   const newAppointment = req.body;

//   // console.log("hiii", newAppointment);

//   const new_appointment = await Appointment.create(newAppointment);
//   // console.log("new appointment is created", new_appointment);
//   if (new_appointment) {
//     res.status(200).json({
//       status: "success",
//       data: new_appointment,
//       message: "New Appointment created successfully",
//     });
//   } else {
//     res.status(400).json({
//       status: "error",
//       message: "Not Able to add appointment.Please try after some time",
//     });
//   }
// };

exports.getMe = async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
};

exports.getMyFriends = async (req, res, next) => {
  const my_id = req.user._id;
  const me = await User.findOne({ _id: my_id });
  const my_friends = me.friends; // Array of friend IDs
  // console.log("myfriends", my_friends);
  const friendsData = await User.find({ _id: { $in: my_friends } }).select(
    "_id name status socket_id"
  );

  // console.log("myfriendData", friendsData);

  res.status(200).json({
    status: "success",
    data: friendsData,
  });
};

exports.addFriend = async (req, res, next) => {
  const { friend } = req.body;
  const my_id = req.user._id;
  const updatedUser = await User.findOneAndUpdate(
    { _id: my_id },
    { $push: { friends: friend } },
    { new: true }
  );

  if (updatedUser) {
    res.status(200).json({
      status: "success",
      data: updatedUser,
      message: "Friend Added successfully",
    });

    return;
  } else {
    res.status(404).json({
      status: "error",
      message: "Not able to add friend. Please try after sometime",
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  const my_friends = req.user.friends;
  const my_id = req.user._id;
  const ids_to_exclude = [my_id, ...my_friends];

  const all_users = await User.find({ _id: { $nin: ids_to_exclude } }).select(
    "_id name role status"
  );

  if (all_users) {
    console.log("all users", all_users);
    res.status(200).json({
      status: "success",
      data: all_users,
    });
  } else {
    res.status(404).json({
      status: "error",
      data: [],
    });
  }
};

exports.getAppointments = async (req, res, next) => {
  const userId = req.user._id;
  const role = req.user.role;
  let allAppointments;
  if (role === "student") {
    allAppointments = await Appointment.find({ from: userId });
  } else if (role === "doctor") {
    // console.log(userId);
    allAppointments = await Appointment.find({ to: userId });
    // console.log("doctor appoint ment: ", allAppointments);
  }
  // console.log(allAppointments);
  res.status(200).json({
    status: "success",
    data: allAppointments,
  });
};

exports.getSlot = async (req, res, next) => {
  const userId = req.user._id;
  // console.log("userId", userId);
  const allSlots = await Slot.findOne({ id: userId });
  // console.log(allSlots);
  res.status(200).json({
    status: "success",
    data: allSlots,
  });
};

exports.getAllSlots = async (req, res, next) => {
  const allSlotData = await Slot.find({ certified: true });
  // console.log("allSlotDtata:::", allSlotData);
  res.status(200).json({
    status: "success",
    data: allSlotData,
  });
};

exports.addSlot = async (req, res, next) => {
  const newSlot = req.body;

  // console.log("hiii", newSlot);
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
  // console.log("new slot is created", new_slot);
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

// exports.approveRejectAppointment = async (req, res, next) => {
//   const { id } = req.params;
//   const newStatus = req.body;
//   const updated_appointment = await Appointment.findByIdAndUpdate(
//     id,
//     newStatus,
//     {
//       new: true,
//     }
//   );
//   if (!updated_appointment) {
//     res.status(404).json({
//       status: "error",
//       message: "Not able to Approve or Reject the request. Please try later",
//       data: updated_appointment,
//     });
//     return;
//   }
//   // console.log("statusValue: ", newStatus);
//   if (newStatus.status === "Approved") {
//     res.status(200).json({
//       status: "success",
//       message: "Successfully Approved the request!",
//       data: updated_appointment,
//     });
//   } else {
//     res.status(200).json({
//       status: "success",
//       message: "successfully Rejected the request",
//       data: updated_appointment,
//     });
//   }
// };

exports.submitCertificate = async (req, res, next) => {
  const { id, category, editFile, certified, name } = req.body;

  const fileName = req.file ? req.file.originalname : null;

  const newSlotData = {
    id,
    category,
    editFile,
    certified,
    name,
    fileName,
  };

  console.log(req.file);
  console.log("body:", req.body);
  const existing_slot = await Slot.findOne({ id: req.body.id });
  if (existing_slot) {
    await Slot.findOneAndUpdate({ id: req.body.id }, newSlotData, {
      new: true,
      validateModifiedOnly: true,
    });
    res.status(200).json({
      status: "success",
      data: existing_slot,
      message: "Successfully updated certificate",
    });

    return;
  }

  const new_slot = await Slot.create(newSlotData);

  if (new_slot) {
    res.status(200).json({
      status: "success",
      data: new_slot,
      message:
        "File submit successfully. Please wait sometime to get certified",
    });
  } else {
    res.status(400).json({
      status: "error",
      message: "Not Able to submit your request.Please try after some time",
    });
  }
};
