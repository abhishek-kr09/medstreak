const mongoose = require("mongoose");

const parentNoteSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, default: "" },
    contentOrLink: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParentNote", parentNoteSchema);
