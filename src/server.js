require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const app = express();

const PORT = process.env.PORT || 3002;
const CLIENT_URL = process.env.REACT_CLIENT_URL;

// Middleware for JSON body parsing
app.use(express.json());
app.use(cookieParser());

// CORS setup for Express
app.use(
	cors({
		origin: CLIENT_URL || "http://localhost:3000",
		credentials: true,
		optionSuccessStatus: 200,
	})
);

// Set Up Socket.io
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: CLIENT_URL || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "DELETE"],
	},
});

// Import routes
const indexRoutes = require("./routes/indexRoutes");
const authRoutes = require("./routes/authRoutes");
const steamRoutes = require("./routes/steamRoutes");

// Use routes
app.use("/auth", authRoutes);
app.use("/", indexRoutes);
app.use("/api/steam", steamRoutes);

// Database Connection
const connectToDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Failed to connect to MongoDB", err);
		process.exit(1);
	}
};

connectToDatabase();

// Socket.io Connection
io.on("connection", (socket) => {
	console.log("a user connected");

	socket.on("message", (message) => {
		console.log("Message received on server:", message);
		io.emit("message", message);
		console.log("Message broadcasted");
	});

	socket.on("disconnect", () => {
		console.log("user disconnected");
	});
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
