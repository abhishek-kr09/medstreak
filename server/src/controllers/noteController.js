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

const updateNote = async (req, res) => {
  const { studentId, noteId } = req.params;
  const { title, contentOrLink } = req.body;

  const note = await ParentNote.findOne({ _id: noteId, student: studentId });
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  if (req.user.role === "parent" && String(note.parent) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  note.title = title || "";
  note.contentOrLink = contentOrLink || "";
  await note.save();
  await note.populate("parent", "name email");

  return res.status(200).json({ note });
};

const deleteNote = async (req, res) => {
  const { studentId, noteId } = req.params;

  const note = await ParentNote.findOne({ _id: noteId, student: studentId });
  if (!note) {
    return res.status(404).json({ message: "Note not found" });
  }

  if (req.user.role === "parent" && String(note.parent) !== String(req.user.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await note.deleteOne();
  return res.status(200).json({ noteId });
};

module.exports = { listNotes, createNote, updateNote, deleteNote };
