const mongoose = require("mongoose");
const DailyLog = require("../models/DailyLog");
const { normalizeDate, isFutureDate, isToday } = require("../utils/date");

const listLogs = async (req, res) => {
  const { studentId } = req.params;
  const { start, end } = req.query;

  const query = { student: studentId };
  if (start || end) {
    query.date = {};
    if (start) {
      const startDate = normalizeDate(start);
      if (!startDate) {
        return res.status(400).json({ message: "Invalid start date" });
      }
      query.date.$gte = startDate;
    }
    if (end) {
      const endDate = normalizeDate(end);
      if (!endDate) {
        return res.status(400).json({ message: "Invalid end date" });
      }
      query.date.$lte = endDate;
    }
  }

  const logs = await DailyLog.find(query).sort({ date: 1 });
  return res.status(200).json({ logs });
};

const createLog = async (req, res) => {
  const { studentId } = req.params;
  const {
    date,
    activityDescription,
    physicsQuestions,
    chemistryQuestions,
    biologyQuestions
  } = req.body;

  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return res.status(400).json({ message: "Invalid date" });
  }

  if (isFutureDate(normalizedDate)) {
    return res.status(400).json({ message: "Future dates are not allowed" });
  }

  if (req.user?.role === "student" && !isToday(normalizedDate)) {
    return res.status(403).json({ message: "Students can only edit today" });
  }

  try {
    const log = await DailyLog.create({
      student: studentId,
      date: normalizedDate,
      activityDescription,
      physicsQuestions,
      chemistryQuestions,
      biologyQuestions
    });
    return res.status(201).json({ log });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Log already exists for date" });
    }
    return res.status(500).json({ message: "Failed to create log" });
  }
};

const updateLog = async (req, res) => {
  const { studentId, logId } = req.params;
  const updates = { ...req.body };

  if (req.user?.role === "student") {
    const existing = await DailyLog.findOne({ _id: logId, student: studentId });
    if (!existing) {
      return res.status(404).json({ message: "Log not found" });
    }
    if (!isToday(normalizeDate(existing.date))) {
      return res.status(403).json({ message: "Students can only edit today" });
    }
  }

  if (updates.date) {
    const normalizedDate = normalizeDate(updates.date);
    if (!normalizedDate) {
      return res.status(400).json({ message: "Invalid date" });
    }
    if (isFutureDate(normalizedDate)) {
      return res.status(400).json({ message: "Future dates are not allowed" });
    }
    if (req.user?.role === "student" && !isToday(normalizedDate)) {
      return res.status(403).json({ message: "Students can only edit today" });
    }
    updates.date = normalizedDate;
  }

  const log = await DailyLog.findOneAndUpdate(
    { _id: logId, student: studentId },
    updates,
    { new: true, runValidators: true }
  );

  if (!log) {
    return res.status(404).json({ message: "Log not found" });
  }

  return res.status(200).json({ log });
};

const deleteLog = async (req, res) => {
  const { studentId, logId } = req.params;
  const existing = await DailyLog.findOne({ _id: logId, student: studentId });
  if (!existing) {
    return res.status(404).json({ message: "Log not found" });
  }

  if (req.user?.role === "student" && !isToday(normalizeDate(existing.date))) {
    return res.status(403).json({ message: "Students can only edit today" });
  }

  const log = await DailyLog.findOneAndDelete({ _id: logId, student: studentId });

  if (!log) {
    return res.status(404).json({ message: "Log not found" });
  }

  return res.status(200).json({ message: "Log deleted" });
};

const getSummary = async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const summary = await DailyLog.aggregate([
    { $match: { student: mongoose.Types.ObjectId.createFromHexString(studentId) } },
    {
      $group: {
        _id: "$student",
        physicsQuestions: { $sum: "$physicsQuestions" },
        chemistryQuestions: { $sum: "$chemistryQuestions" },
        biologyQuestions: { $sum: "$biologyQuestions" }
      }
    }
  ]);

  return res.status(200).json({
    summary: summary[0] || {
      physicsQuestions: 0,
      chemistryQuestions: 0,
      biologyQuestions: 0
    }
  });
};

const getConsistency = async (req, res) => {
  const { studentId } = req.params;
  const { start, end } = req.query;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const match = { student: mongoose.Types.ObjectId.createFromHexString(studentId) };

  if (start || end) {
    match.date = {};
    if (start) {
      const startDate = normalizeDate(start);
      if (!startDate) {
        return res.status(400).json({ message: "Invalid start date" });
      }
      match.date.$gte = startDate;
    }
    if (end) {
      const endDate = normalizeDate(end);
      if (!endDate) {
        return res.status(400).json({ message: "Invalid end date" });
      }
      match.date.$lte = endDate;
    }
  }

  const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata";

  const days = await DailyLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: timeZone
            }
          }
        },
        physicsQuestions: { $sum: "$physicsQuestions" },
        chemistryQuestions: { $sum: "$chemistryQuestions" },
        biologyQuestions: { $sum: "$biologyQuestions" }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);

  const series = days.map((item) => ({
    date: item._id.date,
    physicsQuestions: item.physicsQuestions,
    chemistryQuestions: item.chemistryQuestions,
    biologyQuestions: item.biologyQuestions
  }));

  const toDate = (value) => new Date(`${value}T00:00:00`);
  const computeStreak = (rows, field) => {
    let current = 0;
    let lastDate = null;

    for (const row of rows) {
      const hasValue = Number(row[field] || 0) > 0;
      if (!hasValue) {
        current = 0;
        lastDate = null;
        continue;
      }

      const nextDate = toDate(row.date);
      if (lastDate) {
        const diff = (nextDate.getTime() - lastDate.getTime()) / 86400000;
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }

      lastDate = nextDate;
    }

    return current;
  };

  const totals = {
    physicsActiveDays: series.filter((row) => row.physicsQuestions > 0).length,
    chemistryActiveDays: series.filter((row) => row.chemistryQuestions > 0).length,
    biologyActiveDays: series.filter((row) => row.biologyQuestions > 0).length,
    totalDays: series.length,
    physicsCurrentStreak: computeStreak(series, "physicsQuestions"),
    chemistryCurrentStreak: computeStreak(series, "chemistryQuestions"),
    biologyCurrentStreak: computeStreak(series, "biologyQuestions")
  };

  return res.status(200).json({ series, totals });
};

const getTrends = async (req, res) => {
  const { studentId } = req.params;
  const { start, end } = req.query;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const match = { student: mongoose.Types.ObjectId.createFromHexString(studentId) };

  if (start || end) {
    match.date = {};
    if (start) {
      const startDate = normalizeDate(start);
      if (!startDate) {
        return res.status(400).json({ message: "Invalid start date" });
      }
      match.date.$gte = startDate;
    }
    if (end) {
      const endDate = normalizeDate(end);
      if (!endDate) {
        return res.status(400).json({ message: "Invalid end date" });
      }
      match.date.$lte = endDate;
    }
  }

  const timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata";

  const trends = await DailyLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: timeZone
            }
          }
        },
        physicsQuestions: { $sum: "$physicsQuestions" },
        chemistryQuestions: { $sum: "$chemistryQuestions" },
        biologyQuestions: { $sum: "$biologyQuestions" },
        totalQuestions: {
          $sum: {
            $add: ["$physicsQuestions", "$chemistryQuestions", "$biologyQuestions"]
          }
        }
      }
    },
    { $sort: { "_id.date": 1 } }
  ]);

  return res.status(200).json({
    trends: trends.map((item) => ({
      date: item._id.date,
      physicsQuestions: item.physicsQuestions,
      chemistryQuestions: item.chemistryQuestions,
      biologyQuestions: item.biologyQuestions,
      totalQuestions: item.totalQuestions
    }))
  });
};

module.exports = {
  listLogs,
  createLog,
  updateLog,
  deleteLog,
  getSummary,
  getConsistency,
  getTrends
};
