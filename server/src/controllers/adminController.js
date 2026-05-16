const { nanoid } = require("nanoid");
const User = require("../models/User");
const DailyLog = require("../models/DailyLog");
const ParentNote = require("../models/ParentNote");

const generateUniqueCode = async () => {
  while (true) {
    const code = `MED-${nanoid(6).toUpperCase()}`;
    const exists = await User.exists({ uniqueConnectCode: code });
    if (!exists) {
      return code;
    }
  }
};

const listUsers = async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ users });
};

const getUser = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ user: user.toJSON() });
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updates = { ...req.body };

  delete updates.role;
  delete updates.passwordHash;
  delete updates.parentsLinked;
  delete updates.studentsLinked;
  delete updates.uniqueConnectCode;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (updates.targetExamDate && user.role !== "student") {
    delete updates.targetExamDate;
  }

  if (updates.targetExamDate) {
    updates.targetExamDate = new Date(updates.targetExamDate);
    updates.targetSetAt = new Date();
  }

  Object.assign(user, updates);
  await user.save();

  return res.status(200).json({ user: user.toJSON() });
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "student") {
    await DailyLog.deleteMany({ student: user._id });
    await ParentNote.deleteMany({ student: user._id });
    await User.updateMany(
      { studentsLinked: user._id },
      { $pull: { studentsLinked: user._id } }
    );
  }

  if (user.role === "parent") {
    await ParentNote.deleteMany({ parent: user._id });
    await User.updateMany(
      { parentsLinked: user._id },
      { $pull: { parentsLinked: user._id } }
    );
  }

  await user.deleteOne();
  return res.status(200).json({ message: "User deleted" });
};

const linkParent = async (req, res) => {
  const { parentId, studentId } = req.body;
  const parent = await User.findById(parentId);
  const student = await User.findById(studentId);

  if (!parent || !student) {
    return res.status(404).json({ message: "Parent or student not found" });
  }

  if (parent.role !== "parent" || student.role !== "student") {
    return res.status(400).json({ message: "Invalid roles for linking" });
  }

  await User.updateOne(
    { _id: parent._id },
    { $addToSet: { studentsLinked: student._id } }
  );
  await User.updateOne(
    { _id: student._id },
    { $addToSet: { parentsLinked: parent._id } }
  );

  return res.status(200).json({ message: "Linked" });
};

const unlinkParent = async (req, res) => {
  const { parentId, studentId } = req.body;

  await User.updateOne(
    { _id: parentId },
    { $pull: { studentsLinked: studentId } }
  );
  await User.updateOne(
    { _id: studentId },
    { $pull: { parentsLinked: parentId } }
  );

  return res.status(200).json({ message: "Unlinked" });
};

const resetStudentCode = async (req, res) => {
  const { studentId } = req.params;
  const student = await User.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  if (student.role !== "student") {
    return res.status(400).json({ message: "User is not a student" });
  }

  student.uniqueConnectCode = await generateUniqueCode();
  await student.save();

  return res.status(200).json({ uniqueConnectCode: student.uniqueConnectCode });
};

module.exports = {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  linkParent,
  unlinkParent,
  resetStudentCode
};
