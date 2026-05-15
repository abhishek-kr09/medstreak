const ParentNote = require("../models/ParentNote");
const User = require("../models/User");

const listNotes = async (req, res) => {
  const { studentId } = req.params;
  const notes = await ParentNote.find({ student: studentId })
    .sort({ createdAt: -1 })
    .populate("parent", "name email");

  return res.status(200).json({ notes });
};

const createNote = async (req, res) => {
  const { studentId } = req.params;
  const { title, contentOrLink } = req.body;

  if (req.user.role === "parent") {
    const parent = await User.findById(req.user.id).select("studentsLinked");
    const isLinked = parent?.studentsLinked?.some(
      (linkedId) => String(linkedId) === String(studentId)
    );
    if (!isLinked) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const note = await ParentNote.create({
    parent: req.user.id,
    student: studentId,
    title,
    contentOrLink
  });

  return res.status(201).json({ note });
};

module.exports = { listNotes, createNote };
