const express = require("express");
const {
  registerStudent,
  registerParent,
  registerAdmin,
  login
} = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const {
  registerStudentSchema,
  registerParentSchema,
  registerAdminSchema,
  loginSchema
} = require("../validation/schemas");

const router = express.Router();

router.post(
  "/register-student",
  validate(registerStudentSchema),
  registerStudent
);
router.post(
  "/register-parent",
  validate(registerParentSchema),
  registerParent
);
router.post(
  "/register-admin",
  validate(registerAdminSchema),
  registerAdmin
);
router.post("/login", validate(loginSchema), login);

module.exports = router;
