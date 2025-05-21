const User = require('../models/UserModel');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Login user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, 'yourSecretKey', { expiresIn: '30d' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  const { name, email, password, designation } = req.body;

  try {
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with explicit designation
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      designation: designation || 'Employee',
    });

    const token = jwt.sign({ id: user._id }, 'yourSecretKey', { expiresIn: '30d' });

    // Return user data including designation
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
      },
      token,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select('-password'); // do not send password
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
// @desc    Toggle user blocked status
// @route   PATCH /api/users/:id/toggle-status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent blocking admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot block admin users' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // If user is being blocked, invalidate their token
    if (user.isBlocked) {
      // You might want to implement token invalidation here
      // For example, by adding the token to a blacklist
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
  

module.exports = {
  loginUser,
  registerUser,
  getAllUsers,
  toggleUserStatus,
};
