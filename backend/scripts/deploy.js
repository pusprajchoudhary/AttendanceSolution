const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run commands and handle errors
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Function to check environment variables
function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    return false;
  }

  return true;
}

// Function to create uploads directory
function createUploadsDirectory() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
}

// Function to check MongoDB connection
async function checkMongoDBConnection() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connection successful');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('Starting deployment process...');

  // Check environment variables
  if (!checkEnvironmentVariables()) {
    console.error('Please set all required environment variables');
    process.exit(1);
  }

  // Create uploads directory
  createUploadsDirectory();

  // Check MongoDB connection
  if (!await checkMongoDBConnection()) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  // Clean install dependencies
  console.log('Installing dependencies...');
  if (!runCommand('npm ci')) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }

  // Build the application
  console.log('Building the application...');
  if (!runCommand('npm run build')) {
    console.error('Failed to build the application');
    process.exit(1);
  }

  console.log('Deployment process completed successfully!');
}

// Run the deployment process
deploy(); 