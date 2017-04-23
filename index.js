const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const current = {};

app.post("/", (req, res) => {
	const redirect = encodeURIComponent(config.url);
	const state = uuid.v4();
	current[state] = {
		url: req.body.url,
		issue: req.body.issue,
		comment: req.body.comment
	};
	res.redirect(`https://github.com/login/oauth/authorize?client_id=${config.client_id}&redirect_uri=${redirect}&scope=public_repo&state=${state}`);
});

app.get("/", (req, res) => {
	const code = req.query.code;
	const state = req.query.state;
	const o = current[state];
	delete current[state];
	axios({
		method: "post",
		url: "https://github.com/login/oauth/access_token",
		data: {
			client_id: config.client_id,
			client_secret: config.client_secret,
			code: code,
			state: state
		},
		headers: {
			"Accept": "application/json"
		}
	})
		.then(response => {
			res.redirect(o.url + "#" + encodeURIComponent(JSON.stringify({
				issue: o.issue,
				comment: o.comment,
				token: response.data.access_token
			})));
		})
		.catch(console.log);
});

app.listen(config.port, () => {
	console.log(`Listening on port ${config.port}`);
});