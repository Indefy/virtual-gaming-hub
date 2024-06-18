const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
	const { username, password, steamProfileUrl } = req.body;
	try {
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = new User({
			username,
			password: hashedPassword,
			steamProfileUrl,
		});
		await user.save();
		res.status(201).send("User registered");
	} catch (err) {
		res.status(500).json({ message: "Error registering user" });
	}
});

// Login
router.post("/login", async (req, res) => {
	const { username, password } = req.body;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});
		res.cookie("authToken", token, {
			httpOnly: true,
			sameSite: "Lax",
		});
		res.json({ message: "Login successful" });
	} catch (err) {
		res.status(500).json({ message: "Error logging in" });
	}
});

// Auth check
router.get("/check", (req, res) => {
	const token = req.cookies.authToken;
	if (!token) {
		return res.json({ isAuthenticated: false });
	}

	try {
		jwt.verify(token, process.env.JWT_SECRET);
		res.json({ isAuthenticated: true });
	} catch (error) {
		res.json({ isAuthenticated: false });
	}
});

// Logout
router.post("/logout", (req, res) => {
	res.clearCookie("authToken", {
		httpOnly: true,
		sameSite: "Lax",
	});
	res.json({ message: "Logout successful" });
});

module.exports = router;
