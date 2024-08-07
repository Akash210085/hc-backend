const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  category: {
    type: String,
  },
  name: {
    type: String,
  },
  certified: {
    type: Boolean,
    default: false,
  },

  editFile: {
    type: Boolean,
    default: true,
  },

  fileName: {
    type: String,
  },

  slots: [
    {
      type: String, // Assuming 'preferredSlot' is a Date
    },
  ],
});

const Slot = new mongoose.model("Slot", slotSchema);
module.exports = Slot;
