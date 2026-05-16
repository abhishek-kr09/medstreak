const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { canAccessStudent } = require("../middleware/permissions");
const { validate } = require("../middleware/validate");
const {
  createAttachmentSchema,
  studentIdParamSchema,
  studentAttachmentParamSchema
} = require("../validation/schemas");
const {
  listAttachments,
  createAttachment,
  deleteAttachment
} = require("../controllers/attachmentController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf";
    const isImage = file.mimetype.startsWith("image/");
    if (isPdf || isImage) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or image files are allowed"));
    }
  }
});

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    return next();
  });
};

router.get(
  "/students/:studentId/attachments",
  requireAuth,
  validate(studentIdParamSchema, "params"),
  canAccessStudent,
  listAttachments
);

router.post(
  "/students/:studentId/attachments",
  requireAuth,
  allowRoles("parent", "admin"),
  validate(studentIdParamSchema, "params"),
  canAccessStudent,
  handleUpload,
  validate(createAttachmentSchema),
  createAttachment
);

router.delete(
  "/students/:studentId/attachments/:attachmentId",
  requireAuth,
  allowRoles("parent", "admin"),
  validate(studentAttachmentParamSchema, "params"),
  canAccessStudent,
  deleteAttachment
);

module.exports = router;
