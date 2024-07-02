const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  to: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  from: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  id: {
    type: Number, // Assuming 'id' is an ObjectId
    required: true,
  },
  appointmentType: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  preferredSlot: {
    type: String, // Assuming 'preferredSlot' is a Date
    required: true,
  },
  reasonForAppointment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"], // Example statuses
    required: true,
  },
});

const Appointment = new mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
