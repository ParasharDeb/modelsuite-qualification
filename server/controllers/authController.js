const User = require('../models/User');
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const generateaccessToken = (id, role) => {
  const accessToken = jwt.sign(
  {
    id: id,
    role: role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "15m",
  }
);

  return accessToken
};
const generaterefreshtoken=(id)=>{
  const refreshToken = jwt.sign(
  {
    id: id,
  },
  process.env.REFRESH_SECRET,
  {
    expiresIn: "30d",
  }
);
  return refreshToken
}

// @desc  Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,    });
    const refreshToken=generaterefreshtoken(user._id)
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await RefreshToken.create({
      token: tokenHash,
      user: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: generateaccessToken(user._id, user.role),

    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
   
    if (user && (await bcrypt.compare(password, user.password))) {
      const refreshToken=generaterefreshtoken(user._id)
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await RefreshToken.create({
      token: tokenHash,
      user: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken: generateaccessToken(user._id, user.role),

      });
    } else {
      // — less secure but also unhelpful UX
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  let userId = null;

  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      userId = decoded.id;

      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await RefreshToken.updateOne({ token: tokenHash }, { revoked: true });
    } catch {
      // Refresh token may already be expired; fall back to the access token.
    }
  }

  if (!userId && req.headers.authorization?.startsWith("Bearer")) {
    try {
      const accessToken = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      // Ignore invalid access tokens and still clear the cookie below.
    }
  }

  if (userId) {
    await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "No refresh token provided",
            });
        }

        // Verify JWT signature and expiry
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET
        );

        // Hash the token because the DB stores the hash
        const tokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // Check if the refresh token exists and hasn't been revoked
        const storedToken = await RefreshToken.findOne({
            token: tokenHash,
            revoked: false,
        });

        if (!storedToken) {
            return res.status(401).json({
                message: "Refresh token is invalid or revoked",
            });
        }

        // Ensure the user still exists
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        // Issue a new access token
        const accessToken = generateaccessToken(
            user._id,
            user.role
        );

        return res.json({
            accessToken,
        });
    } catch (error) {
        return res.status(401).json({
            message: "Refresh token expired or invalid",
        });
    }
};
module.exports = { registerUser, loginUser ,logout,refresh};
