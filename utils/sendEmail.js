const nodemailer = require("nodemailer");
const nodemailerConfig = require('./nodemailerConfig')

const sendEmail = async ({to, subject, text, html}) => {
	try {
		const transporter = nodemailer.createTransport(nodemailerConfig);

		await transporter.sendMail({
			from: process.env.USER,
			to,
			subject,
			text,
			html
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};


module.exports = sendEmail
