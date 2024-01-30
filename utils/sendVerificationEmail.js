const sendEmail = require('./sendEmail')

// this is the body for the email
// origin will be done in the front-end/client

const sendVerificationEmail = async({name, school_email, verificationToken, origin}) => {
    const verifyEmail = `${origin}/verify?token=${verificationToken}&email=${school_email}`

    const verifyMessage = `
    <div style='background-color:white; padding:1rem; width:90%; margin:auto; font-family:"Trebuchet MS";'>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem;">
            <h1 style="font-size:30px; font-weight:bold; color:#7286D3; margin:0;">PAUCS</h1>
        </div>
        <div style='box-shadow:0px 2px 5px #7286D3; padding:1rem; width:40rem; margin:auto;'>
        <div style='text-align:center;'><img src="https://res.cloudinary.com/dkxtpgajz/image/upload/v1701650793/email-bg/xpmwbo6zqz4zivyybtqm.png" style='width:450px; margin:auto;'/></div>
        <div style="text-align:center; margin-top:1rem;">
            <h1 style="font-style:normal; font-size:35px; margin:0;">Email Confirmation</h1>
            <p style="color:gray; font-size:15px; margin:0;">Hey Araullians, you're almost ready to start browsing in PAUCS. Simply click the button below to verify your email address.</p>
            <a href="${verifyEmail}" style="display: inline-block; text-decoration: none;">
                <button style="background-color:#7286D3; color:white; padding:0.80rem; border:none; border-radius:5px; font-size:16px; cursor:pointer;">Verify email address</button>
            </a>
        </div>
        </div>
        <div style="text-align:center; border-top:1px solid gray; padding-top:1rem;">
            <p>Email sent by PAUCS</p>
            <p>&copy; Copyright 2023 PAUCS ORG, All rights reserved.</p>
        </div>
    </div>`


  return sendEmail({to:school_email, subject:'Verify Your Email', html:verifyMessage})
}

module.exports = sendVerificationEmail