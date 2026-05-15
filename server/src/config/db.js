const mongoose = require("mongoose");

const connectDb = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri);
};

module.exports = { connectDb };
