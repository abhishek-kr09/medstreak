const ParentAttachment = require("../models/ParentAttachment");
const User = require("../models/User");
const { cloudinary } = require("../services/cloudinary");

const uploadToCloudinary = (fileBuffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(fileBuffer);
  });

const listAttachments = async (req, res) => {
  const { studentId } = req.params;
  const attachments = await ParentAttachment.find({ student: studentId })
    .sort({ createdAt: -1 })
    .populate("parent", "name email");

  return res.status(200).json({ attachments });
};

const createAttachment = async (req, res) => {
  const { studentId } = req.params;
  const { title } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "File is required" });
  }

  if (req.user.role === "parent") {
    const parent = await User.findById(req.user.id).select("studentsLinked");
    const isLinked = parent?.studentsLinked?.some(
      (linkedId) => String(linkedId) === String(studentId)
    );
    if (!isLinked) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const folder = process.env.CLOUDINARY_FOLDER || "medstreak/attachments";
  const result = await uploadToCloudinary(file.buffer, {
    folder,
    resource_type: "auto",
    use_filename: true,
    filename_override: file.originalname
  });

  const attachment = await ParentAttachment.create({
    parent: req.user.id,
    student: studentId,
    title: title || "",
    fileUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    fileType: file.mimetype,
    fileName: file.originalname,
    fileSize: file.size
  });

  await attachment.populate("parent", "name email");

  return res.status(201).json({ attachment });
};

const deleteAttachment = async (req, res) => {
  const { studentId, attachmentId } = req.params;

  const attachment = await ParentAttachment.findOne({
    _id: attachmentId,
    student: studentId
  });

  if (!attachment) {
    return res.status(404).json({ message: "Attachment not found" });
  }

  if (req.user.role === "parent" && String(attachment.parent) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await cloudinary.uploader.destroy(attachment.publicId, {
    resource_type: attachment.resourceType || "auto"
  });

  await attachment.deleteOne();
  return res.status(200).json({ attachmentId });
};

module.exports = { listAttachments, createAttachment, deleteAttachment };
