const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { canAccessStudent } = require("../middleware/permissions");
const { validate } = require("../middleware/validate");
const {
  listLogs,
  createLog,
  updateLog,
  deleteLog,
  getSummary
} = require("../controllers/dailyLogController");
const {
  listLogsQuerySchema,
  createLogSchema,
  updateLogSchema,
  studentIdParamSchema,
  studentLogParamSchema,
  updateTargetSchema
} = require("../validation/schemas");
const User = require("../models/User");
const DailyLog = require("../models/DailyLog");

const router = express.Router();

router.get(
  "/me",
  requireAuth,
  allowRoles("student"),
  async (req, res) => {
    const student = await User.findById(req.user.id);
    return res.status(200).json({ user: student?.toJSON() });
  }
);

router.patch(
  "/me/target",
  requireAuth,
  allowRoles("student"),
  validate(updateTargetSchema),
  async (req, res) => {
    const { targetExamDate } = req.body;
    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!targetExamDate) {
      student.targetExamDate = null;
      await student.save();
      await DailyLog.deleteMany({ student: student._id });
      return res.status(200).json({ user: student.toJSON(), logsCleared: true });
    }

    student.targetExamDate = targetExamDate;
    await student.save();
    return res.status(200).json({ user: student.toJSON(), logsCleared: false });
  }
);

router.get(
  "/:studentId/logs",
  requireAuth,
  validate(studentIdParamSchema, "params"),
  validate(listLogsQuerySchema, "query"),
  canAccessStudent,
  listLogs
);

router.get(
  "/:studentId/logs/summary",
  requireAuth,
  validate(studentIdParamSchema, "params"),
  canAccessStudent,
  getSummary
);

router.post(
  "/:studentId/logs",
  requireAuth,
  allowRoles("student", "admin"),
  validate(studentIdParamSchema, "params"),
  validate(createLogSchema),
  canAccessStudent,
  createLog
);

router.put(
  "/:studentId/logs/:logId",
  requireAuth,
  allowRoles("student", "admin"),
  validate(studentLogParamSchema, "params"),
  validate(updateLogSchema),
  canAccessStudent,
  updateLog
);

router.delete(
  "/:studentId/logs/:logId",
  requireAuth,
  allowRoles("student", "admin"),
  validate(studentLogParamSchema, "params"),
  canAccessStudent,
  deleteLog
);

module.exports = router;
