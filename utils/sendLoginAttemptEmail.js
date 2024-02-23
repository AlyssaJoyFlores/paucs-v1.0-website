const sendEmail = require('./sendEmail')

// this is the body for the email
// origin will be done in the front-end/client

const sendLoginAttempEmail = async({name, school_email, token, origin, dateLog, device, school_id}) => {
    //const resetLink = `${origin}/resetpass?token=${token}&email=${school_email}`
   //const blockUrl = `${origin}/api/auth/manage-device?action=block&device=${encodeURIComponent(device)}&school_id=${school_id}`;
    //const allow = `${origin}/api/auth/manage-device?action=allow&device=${encodeURIComponent(device)}&school_id=${school_id}`;

    const blockUrl = `${origin}/manage-device?action=block&device=${encodeURIComponent(device)}&school_id=${school_id}`;
    const allow = `${origin}/manage-device?action=allow&device=${encodeURIComponent(device)}&school_id=${school_id}`;

    const attempMessage = `
    <div style='background-color:white; padding:1rem; width:90%; margin:auto; font-family:"Trebuchet MS";'>
        <div style="text-align:center; margin-top:1rem;">
            <p style="color:gray; font-size:15px; margin:0;">Hi ${name}, A log in attempt from unrecognized device detected on your account on ${dateLog} using ${device}</p>
            <p>If this was not you, you can block this device by clicking the button below:</p>
            <a href="${blockUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Block Device</a>
            <a href="${allow}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Allow Device</a>
        </div>
        <div style="text-align:center; border-top:1px solid gray; padding-top:1rem;">
            <p>Email sent by PAUCS</p>
            <p>&copy; Copyright 2023 PAUCS ORG, All rights reserved.</p>
        </div>
    </div>`;

    return sendEmail({ to: school_email, subject: 'Attempt Logged In', html: attempMessage });
}

module.exports = sendLoginAttempEmail
