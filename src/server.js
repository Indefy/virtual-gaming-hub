require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const app = express();

// Middleware for JSON body parsing
app.use(express.json());

// Use cookie-parser middleware
app.use(cookieParser());

// CORS setup for Express
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true, //access-control-allow-credentials:true
		optionSuccessStatus: 200,
	})
);

// Set Up Socket.io
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

// Import routes
const indexRoutes = require("./routes/indexRoutes");
const authRoutes = require("./routes/authRoutes");

// Use routes
app.use("/auth", authRoutes);
app.use("/", indexRoutes);

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

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
