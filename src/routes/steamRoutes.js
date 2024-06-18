const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const STEAM_API_KEY = process.env.STEAM_API_KEY;

router.get("/", (req, res) => {
	res.send("Steam Routes");
});

router.get("/compare-achievements", async (req, res) => {
	const { competitorProfile, gameId } = req.query;
	const token = req.cookies.authToken;

	if (!token) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.userId;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const userSteamID = await getSteamID(user.steamProfileUrl);
		const competitorSteamID = await getSteamID(competitorProfile);

		const userAchievements = await fetchAchievements(userSteamID, gameId);
		const competitorAchievements = await fetchAchievements(
			competitorSteamID,
			gameId
		);

		const achievementsData = await fetchSteamAchievements(gameId);

		res.json({
			userAchievements,
			competitorAchievements,
			achievementsData,
		});
	} catch (error) {
		console.error("Error fetching achievements:", error);
		res.status(500).json({ message: "Error fetching achievements", error });
	}
});

const getSteamID = async (profileUrl) => {
	if (/^\d{17}$/.test(profileUrl)) {
		return profileUrl;
	}

	const vanityUrl = profileUrl.split("/").pop();
	try {
		const response = await axios.get(
			`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`
		);
		if (response.data.response.success === 1) {
			return response.data.response.steamid;
		} else {
			console.error(
				`Error resolving vanity URL: ${response.data.response.message}`
			);
			return "";
		}
	} catch (error) {
		console.error(`Error fetching Steam ID: ${error.message}`);
		return "";
	}
};

const fetchAchievements = async (steamID, gameId) => {
	const response = await axios.get(
		`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${gameId}&key=${STEAM_API_KEY}&steamid=${steamID}`
	);
	return response.data.playerstats.achievements;
};

const fetchSteamAchievements = async (appId) => {
	const response = await axios.get(
		`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appId}`
	);
	return response.data.game.availableGameStats.achievements;
};

module.exports = router;
