const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema({
  to: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  from: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["Text", "Media", "Document", "Link", "Divider"],
  },
  created_at: {
    type: Date,
    default: () => Date.now(),
  },
  text: {
    type: String,
  },
  file: {
    type: String,
  },
});

const OneToOneMessage = new mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
module.exports = OneToOneMessage;
