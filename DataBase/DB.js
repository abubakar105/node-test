const mongoose = require("mongoose");
const Db = process.env.DB;

// Cache the database connection for serverless environments
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(Db, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log("DB Connected Successfully");
  } catch (error) {
    console.error("Error Connecting DB:", error.message);
    throw error;
  }
};

// Initialize connection
connectDB().catch(console.error);

module.exports = connectDB;
