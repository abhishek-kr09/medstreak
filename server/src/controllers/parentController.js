const User = require("../models/User");

const listLinkedStudents = async (req, res) => {
  const parent = await User.findById(req.user.id).populate(
    "studentsLinked",
    "name email targetExamDate"
  );

  if (!parent) {
    return res.status(404).json({ message: "Parent not found" });
  }

  return res.status(200).json({ students: parent.studentsLinked || [] });
};

module.exports = { listLinkedStudents };
