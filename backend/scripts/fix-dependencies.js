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

// Function to check Node.js version
function checkNodeVersion() {
  const version = process.version;
  console.log(`Current Node.js version: ${version}`);
  
  // Check if version is compatible
  const majorVersion = parseInt(version.split('.')[0].replace('v', ''));
  if (majorVersion < 16) {
    console.error('Node.js version must be 16 or higher');
    return false;
  }
  return true;
}

// Function to clean npm cache
function cleanNpmCache() {
  console.log('Cleaning npm cache...');
  return runCommand('npm cache clean --force');
}

// Function to remove node_modules and package-lock.json
function cleanInstall() {
  console.log('Removing node_modules and package-lock.json...');
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
}

// Function to install dependencies
function installDependencies() {
  console.log('Installing dependencies...');
  return runCommand('npm install');
}

// Function to rebuild node-gyp
function rebuildNodeGyp() {
  console.log('Rebuilding node-gyp...');
  return runCommand('npm rebuild');
}

// Main function to fix issues
async function fixIssues() {
  console.log('Starting dependency fix process...');

  // Check Node.js version
  if (!checkNodeVersion()) {
    console.error('Please update Node.js to version 16 or higher');
    process.exit(1);
  }

  // Clean npm cache
  if (!cleanNpmCache()) {
    console.error('Failed to clean npm cache');
    process.exit(1);
  }

  // Clean install
  cleanInstall();

  // Install dependencies
  if (!installDependencies()) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }

  // Rebuild node-gyp
  if (!rebuildNodeGyp()) {
    console.error('Failed to rebuild node-gyp');
    process.exit(1);
  }

  console.log('Dependency fix process completed successfully!');
}

// Run the fix process
fixIssues(); 