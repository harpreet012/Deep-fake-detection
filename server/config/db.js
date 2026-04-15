const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If no MONGO_URI set, fall back to in-memory for local development
    if (!uri || uri.includes('127.0.0.1')) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`Ephemeral MongoDB Connected (local dev mode)`);
      console.log(`Compass URI: ${uri}`);
    }

    await mongoose.connect(uri);
    console.log(`MongoDB Connected Successfully!`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
