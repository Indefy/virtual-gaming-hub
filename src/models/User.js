const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	// Can add more fields like email, avatar, etc. if needed
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const User = mongoose.model("User", userSchema);

module.exports = User;
