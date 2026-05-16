const mongoose = require("mongoose");

const parentAttachmentSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, default: "" },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParentAttachment", parentAttachmentSchema);
