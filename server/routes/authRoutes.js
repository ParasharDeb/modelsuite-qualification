const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logout,
    refresh,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/refresh", refresh);


module.exports = router;
