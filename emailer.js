
exports.sendEmail = function(subject, message) {

	var emailSettings = require('./settings.json');

	var email = require("./node_modules/emailjs/email");
	var server = email.server.connect({
		user: "gc01.bl307@gmail.com",
		password: "uclisgreat",
		host: "smtp.gmail.com",
		ssl: true
	});

// send the message and get a callback with an error or details of the message that was sent
	server.send({
		text: message,
		from: "HiveSense <hivesense.net@gmail.com>",
		to: emailSettings.beek + " <" + emailSettings.email + ">",
		subject: subject
	}, function(err, message) {
		console.log(err || message);
	});
}

