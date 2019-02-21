"use strict";
const util = require('util');
const https = require('https');
const config = require('./config');

// Keep TCP connections to servers (keep-alive)
const agent = new https.Agent({keepAlive: true});

function request(url, options = {}, data = undefined) {
	return new Promise((resolve, rej) => {
		if (!url.startsWith('https://')) {
			res(new Error('Only https:// scheme is allowed'));
		}

		if (typeof options.method !== 'string') options.method = 'GET';
		if (typeof options.headers !== 'object') options.headers = {};
		options.agent = agent;
		options.headers['Connection'] = 'keep-alive';
		options.headers['User-Agent'] = config.userAgent;

		const req = https.request(url, options, (res) => {
			if (res.statusCode >= 300) return rej(new Error(util.format('HTTP ERROR: %s %s', res.statusCode, res.statusMessage)));

			let data = '';
			res.setEncoding('utf8');
			res.on('data', d => data += d);

			res.on('end', () => {
				if (!res.complete) return rej(new Error('The connection was unexpectedly terminated'));
				resolve({res, data})
			});
		});

		if (data !== undefined) req.write(data);
		req.end();

		req.on('error', e => rej(e));
	});
}

async function reddit_new(sub, before) {
	const res = await request(util.format('https://www.reddit.com/r/%s/new.json?before=%s&limit=%d&show=all&raw_json=1', sub, before, config.maxThreads));
	return JSON.parse(res.data).data.children.map(i => i.data).reverse();
}

async function discord_webhook(url, data) {
	const res = await request(url + '?wait=true', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	}, JSON.stringify(data));

	res.data = JSON.parse(res.data);
	return res;
}

module.exports = {request, reddit_new, discord_webhook};
