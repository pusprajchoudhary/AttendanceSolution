const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const maxRetries = 5;
  let retryCount = 0;

  const connectWithRetry = async () => {
    try {
      // Log the MongoDB URI (without sensitive information)
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGO_URI is not defined in environment variables');
      }
      console.log('Attempting to connect to MongoDB...');

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // Increased timeout
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
        minPoolSize: 5,
        retryWrites: true,
        w: 'majority',
        heartbeatFrequencyMS: 2000,
        connectTimeoutMS: 30000,
        keepAlive: true,
        keepAliveInitialDelay: 300000
      };

      await mongoose.connect(mongoUri, options);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      console.error('Full error:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s
        console.log(`Retrying connection (${retryCount}/${maxRetries}) in ${delay/1000}s...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.error('Max retries reached. Could not connect to MongoDB');
        // Don't exit the process, just log the error
        console.error('Please check your MongoDB connection string and network connectivity');
      }
    }
  };

  // Set up event listeners for connection
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
    retryCount = 0; // Reset retry count on successful connection
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    // Attempt to reconnect on error
    if (retryCount < maxRetries) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`Attempting to reconnect (${retryCount}/${maxRetries}) in ${delay/1000}s...`);
      setTimeout(connectWithRetry, delay);
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    // Attempt to reconnect on disconnect
    if (retryCount < maxRetries) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`Attempting to reconnect (${retryCount}/${maxRetries}) in ${delay/1000}s...`);
      setTimeout(connectWithRetry, delay);
    }
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing mongoose connection:', err);
      process.exit(1);
    }
  });

  // Start the connection
  await connectWithRetry();
};

module.exports = connectDB;
