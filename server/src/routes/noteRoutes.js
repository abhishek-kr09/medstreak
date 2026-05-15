const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { canAccessStudent } = require("../middleware/permissions");
const { validate } = require("../middleware/validate");
const {
  createNoteSchema,
  studentIdParamSchema,
  studentNoteParamSchema
} = require("../validation/schemas");
const { listNotes, createNote, updateNote, deleteNote } = require("../controllers/noteController");

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

router.put(
  "/students/:studentId/notes/:noteId",
  requireAuth,
  allowRoles("parent", "admin"),
  validate(studentNoteParamSchema, "params"),
  validate(createNoteSchema),
  canAccessStudent,
  updateNote
);

router.delete(
  "/students/:studentId/notes/:noteId",
  requireAuth,
  allowRoles("parent", "admin"),
  validate(studentNoteParamSchema, "params"),
  canAccessStudent,
  deleteNote
);

module.exports = router;
