const config = {
	userAgent: "node:discord-reddit-crosspost:v1.0.0 (by /u/zoddo98)",
	fetchInterval: 1, // minutes
	maxThreads: 5, // per fetch
	subs: {
		"Vexera": {
			"webhook": "https://discordapp.com/api/webhooks/****************/***************************",
			"text_length": 200,
		},
	},
};

module.exports = config;
