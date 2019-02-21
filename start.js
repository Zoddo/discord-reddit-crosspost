"use strict";
const util = require('util');
const request = require('./request');
const config = require('./config');
const db = require('./database');
const log = require('./util/log');

// Very basic lock to prevent a new check to start if the previous one doesn't have finished
let locked = false;

async function check_all() {
	if (locked) return;
	locked = true;

	for (const sub of Object.keys(config.subs)) {
		// We use await, so we only have on concurrent request
		await update_subreddit(sub);
	}

	db.save();
	locked = false;
}

async function update_subreddit(sub) {
	log('Checking sub /r/%s…', sub);
	const subdb = db.sub(sub);

	const threads = await request.reddit_new(sub, subdb.last_thing);
	for (const t of threads) {
		await send_post(sub, t);
		subdb.last_thing = t.name;
	}
}

async function send_post(sub, t) {
	log('Sending post for %s (on /r/%s)…', t.name, sub);

	const embed = {};
	embed.color = 0xff4500;

	if (t.title.length > 256) embed.title = t.title.slice(0, 255) + '…';
	else embed.title = t.title;

	embed.url = 'https://reddit.com' + t.permalink;
	embed.author = {
		name: '/u/' + t.author,
		url: 'https://reddit.com/u/' + t.author
	};

	let image;
	if (t.media && Object.keys(t.media).length) {
		if ('oembed' in t.media) image = t.media.oembed.thumbnail_url;
	} else if (t.preview && Object.keys(t.preview).length) {
		if ('images' in t.preview) image = t.preview.images[0].source.url;
	}

	const link = (t.url !== 'https://www.reddit.com' + t.permalink) ? t.url : '';

	if (t.selftext || link) {
		embed.description = '';

		if (t.selftext) {
			const max_length = config.subs[sub].text_length;
			if (t.selftext.length > max_length) embed.description += t.selftext.slice(0, max_length-1) + '…';
			else embed.description += t.selftext;
		}

		if (link) {
			if (embed.description) embed.description += '\n\n';
			if (link.length < 50) embed.description += util.format('\\↪ [%s](%s)', link);
			else embed.description += util.format('\\↪ [Open %s link](%s)', t.domain, link);
		}

		if (image) embed.thumbnail = {url: image};
	} else if (image) {
		embed.image = {url: image};
	}

	return request.discord_webhook(config.subs[sub].webhook, {embeds: [embed]});
}

db.init();
check_all();
setInterval(check_all, config.fetchInterval * 60000);
