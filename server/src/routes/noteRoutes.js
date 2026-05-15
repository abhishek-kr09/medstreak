const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { canAccessStudent } = require("../middleware/permissions");
const { validate } = require("../middleware/validate");
const {
  createNoteSchema,
  studentIdParamSchema
} = require("../validation/schemas");
const { listNotes, createNote } = require("../controllers/noteController");

const router = express.Router();

router.get(
  "/students/:studentId/notes",
  requireAuth,
  validate(studentIdParamSchema, "params"),
  canAccessStudent,
  listNotes
);

router.post(
  "/students/:studentId/notes",
  requireAuth,
  allowRoles("parent", "admin"),
  validate(studentIdParamSchema, "params"),
  validate(createNoteSchema),
  canAccessStudent,
  createNote
);

module.exports = router;
