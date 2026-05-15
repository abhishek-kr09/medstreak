const User = require("../models/User");

const canAccessStudent = async (req, res, next) => {
  const { studentId } = req.params;
  const { role, id } = req.user || {};

  if (!studentId) {
    return res.status(400).json({ message: "studentId is required" });
  }

  if (role === "admin") {
    return next();
  }

  if (role === "student" && id === studentId) {
    return next();
  }

  if (role === "parent") {
    const parent = await User.findById(id).select("studentsLinked");
    const isLinked = parent?.studentsLinked?.some(
      (linkedId) => String(linkedId) === String(studentId)
    );
    if (isLinked) {
      return next();
    }
  }

  return res.status(403).json({ message: "Forbidden" });
};

module.exports = { canAccessStudent };
