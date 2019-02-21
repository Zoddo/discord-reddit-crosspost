"use strict";
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const log = require('./util/log');

const dbFile = path.join(__dirname, 'db.json');

const data = {subs: {}};
let lastSum;

function init() {
	log('Loading database…');

	if (fs.existsSync(dbFile)) {
		const j = fs.readFileSync(dbFile, {encoding: 'utf8'});
		Object.assign(data, JSON.parse(j));
	}

	lastSum = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

function save() {
	const j = JSON.stringify(data);
	const sum = crypto.createHash('md5').update(j).digest('hex');

	if (sum === lastSum) return; // Don't write the file if datas have not changed

	log('Saving database…');
	fs.writeFileSync(dbFile, j, {mode: 0o640});
	lastSum = sum;
}

function sub(s) {
	if (typeof data.subs[s] !== 'object')
		data.subs[s] = {};

	return data.subs[s];
}

module.exports = {data, init, save, sub};
