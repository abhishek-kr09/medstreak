const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { validate } = require("../middleware/validate");
const {
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserSchema,
  linkParentSchema,
  studentIdParamSchema
} = require("../validation/schemas");
const {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  linkParent,
  unlinkParent,
  resetStudentCode
} = require("../controllers/adminController");

const router = express.Router();

router.use(requireAuth, allowRoles("admin"));

router.get("/users", validate(listUsersQuerySchema, "query"), listUsers);
router.get("/users/:userId", validate(userIdParamSchema, "params"), getUser);
router.patch(
  "/users/:userId",
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  updateUser
);
router.delete(
  "/users/:userId",
  validate(userIdParamSchema, "params"),
  deleteUser
);

router.post("/links", validate(linkParentSchema), linkParent);
router.delete("/links", validate(linkParentSchema), unlinkParent);

router.post(
  "/students/:studentId/reset-code",
  validate(studentIdParamSchema, "params"),
  resetStudentCode
);

module.exports = router;
