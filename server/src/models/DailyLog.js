const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    activityDescription: { type: String, trim: true, default: "" },
    physicsQuestions: { type: Number, default: 0, min: 0 },
    chemistryQuestions: { type: Number, default: 0, min: 0 },
    biologyQuestions: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

dailyLogSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyLog", dailyLogSchema);
