const sendEmail = require('./sendEmail')

// this is the body for the email
// origin will be done in the front-end/client

const sendLoginAttempEmail = async({name, school_email, token, origin, dateLog, userAgent, deviceUse, school_id, osUse, browserUse, cpuUse, deviceType}) => {
    //const resetLink = `${origin}/resetpass?token=${token}&email=${school_email}`
    // const blockUrl = `${origin}/api/auth/manage-device?action=block&device=${encodeURIComponent(device)}&ip=${encodeURIComponent(ip)}&school_id=${school_id}`;
    // const allow = `${origin}/api/auth/manage-device?action=allow&device=${encodeURIComponent(device)}&ip=${encodeURIComponent(ip)}&school_id=${school_id}`;
    
     const allow = `${origin}/api/auth/manage-device?action=allow&userAgent=${encodeURIComponent(userAgent)}&deviceUse=${encodeURIComponent(deviceUse)}&cpuUse=${encodeURIComponent(cpuUse)}&browserUse=${encodeURIComponent(browserUse)}&school_id=${school_id}&osUse=${encodeURIComponent(osUse)}&deviceType=${encodeURIComponent(deviceType)}`

    const blockUrl = `${origin}/manage-device?action=block&userAgent=${encodeURIComponent(userAgent)}&deviceUse=${encodeURIComponent(deviceUse)}&cpuUse=${encodeURIComponent(cpuUse)}&browserUse=${encodeURIComponent(browserUse)}&school_id=${school_id}`;
    // const allow = `${origin}/manage-device?action=allow&userAgent=${encodeURIComponent(userAgent)}&deviceUse=${encodeURIComponent(deviceUse)}&school_id=${school_id}&cpuUse=${encodeURIComponent(cpuUse)}`;

    const attempMessage = `
    <div style='background-color:white; padding:1rem; width:90%; margin:auto; font-family:"Trebuchet MS";'>
        <div style="text-align:center; margin-top:1rem;">
            <p style="color:gray; font-size:15px; margin:0;">Hi ${name}, A log in attempt from unrecognized device detected on your account on ${dateLog} using ${userAgent} and device ${deviceUse} and browser ${browserUse} and os ${osUse} and cpu ${cpuUse} and deviceType ${deviceType}</p>
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