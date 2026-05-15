const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const dateString = z.string().refine((value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}, "Invalid date");

const nonNegativeInt = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  },
  z.number().int().min(0)
);

const optionalNonNegativeInt = nonNegativeInt.optional();

const registerStudentSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const registerParentSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  studentConnectCode: z.string().trim().min(1)
});

const registerAdminSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6),
  adminKey: z.string().trim().min(1)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const listLogsQuerySchema = z.object({
  start: dateString.optional(),
  end: dateString.optional()
});

const createLogSchema = z.object({
  date: dateString,
  activityDescription: z.string().trim().max(2000).optional(),
  physicsQuestions: optionalNonNegativeInt,
  chemistryQuestions: optionalNonNegativeInt,
  biologyQuestions: optionalNonNegativeInt
});

const updateLogSchema = z.object({
  date: dateString.optional(),
  activityDescription: z.string().trim().max(2000).optional(),
  physicsQuestions: optionalNonNegativeInt,
  chemistryQuestions: optionalNonNegativeInt,
  biologyQuestions: optionalNonNegativeInt
});

const createNoteSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    contentOrLink: z.string().trim().max(2000).optional()
  })
  .refine((data) => data.title || data.contentOrLink, {
    message: "Title or content is required"
  });

const studentIdParamSchema = z.object({
  studentId: objectId
});

const studentLogParamSchema = z.object({
  studentId: objectId,
  logId: objectId
});

const studentNoteParamSchema = z.object({
  studentId: objectId,
  noteId: objectId
});

const listUsersQuerySchema = z.object({
  role: z.enum(["student", "parent", "admin"]).optional()
});

const userIdParamSchema = z.object({
  userId: objectId
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  targetExamDate: dateString.optional()
});

const targetExamDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.union([dateString, z.null()])
);

const updateTargetSchema = z.object({
  targetExamDate: targetExamDateSchema
});

const linkParentSchema = z.object({
  parentId: objectId,
  studentId: objectId
});

module.exports = {
  registerStudentSchema,
  registerParentSchema,
  registerAdminSchema,
  loginSchema,
  listLogsQuerySchema,
  createLogSchema,
  updateLogSchema,
  createNoteSchema,
  studentIdParamSchema,
  studentLogParamSchema,
  studentNoteParamSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserSchema,
  linkParentSchema,
  updateTargetSchema
};
