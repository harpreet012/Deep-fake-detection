const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    // Spin up an ephemeral in-memory MongoDB instance!
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const conn = await mongoose.connect(uri);
    console.log(`Ephemeral MongoDB Connected seamlessly!`);
    console.log(`-------------------------------------------------`);
    console.log(`Compass Connection URI:`);
    console.log(`\n${uri}\n`);
    console.log(`-------------------------------------------------`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
