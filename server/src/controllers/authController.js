const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const User = require("../models/User");

const generateToken = (user) =>
  jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

const generateUniqueCode = async () => {
  while (true) {
    const code = `MED-${nanoid(6).toUpperCase()}`;
    const exists = await User.exists({ uniqueConnectCode: code });
    if (!exists) {
      return code;
    }
  }
};

const registerStudent = async (req, res) => {
  const { name, email, password, targetExamDate } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const uniqueConnectCode = await generateUniqueCode();

  const student = await User.create({
    name,
    email,
    passwordHash,
    role: "student",
    targetExamDate,
    uniqueConnectCode,
    parentsLinked: []
  });

  const token = generateToken(student);
  return res.status(201).json({
    token,
    user: student.toJSON()
  });
};

const registerParent = async (req, res) => {
  const { name, email, password, studentConnectCode } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const student = await User.findOne({ uniqueConnectCode: studentConnectCode });
  if (!student) {
    return res.status(404).json({ message: "Student code not found" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const parent = await User.create({
    name,
    email,
    passwordHash,
    role: "parent",
    studentsLinked: [student._id]
  });

  student.parentsLinked = student.parentsLinked || [];
  student.parentsLinked.push(parent._id);
  await student.save();

  const token = generateToken(parent);
  return res.status(201).json({
    token,
    user: parent.toJSON()
  });
};

const registerAdmin = async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  if (!process.env.ADMIN_REGISTRATION_KEY) {
    return res.status(500).json({ message: "Admin registration disabled" });
  }

  if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
    return res.status(403).json({ message: "Invalid admin key" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "admin"
  });

  const token = generateToken(admin);
  return res.status(201).json({ token, user: admin.toJSON() });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);
  return res.status(200).json({ token, user: user.toJSON() });
};

module.exports = {
  registerStudent,
  registerParent,
  registerAdmin,
  login
};
