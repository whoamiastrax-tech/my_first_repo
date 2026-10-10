const mongoose = require("mongoose");

const msgSchema = new mongoose.Schema({
  group: {
    user1: String,
    user2: String,
  },

  message: [
    {
      msg: String,
      date: {
        type: Date,
        default: Date.now(),
      },
      user: String,
    },
  ],
});

const msgModel = mongoose.model("msg", msgSchema);

module.exports = msgModel;
