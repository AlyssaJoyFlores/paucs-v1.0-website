const User = require('../models/usersModel')
const Token = require('../models/tokenModel')
const CustomError = require('../errors')
const crypto = require('crypto')
const axios = require('axios');
const moment = require('moment')
const UAParser = require('ua-parser-js');
const os = require('os')
require('dotenv').config();
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, sendVerificationEmail, sendResetPasswordEmail, sendLoginAttempEmail, createHash} = require('../utils')



const register = async (req, res) => {
    const {
        school_id,
        school_email,
        password,
        school_campus,
        college_dept,
        full_name,
        course,
        year,
        section,
        gender,
        birthdate,
        address,
        status,
        freeUnifStatus,
        profile_image,
        orf_image,
        cover_image,
        isAgreedToTerms
    } = req.body;

    if (!/^(\d{2}-\d{4}-\d{6})$/.test(school_id)) {
        throw new CustomError.BadRequestError('Invalid school ID format. Please use the format 00-0000-000000');
    }


    const emailExist = await User.findOne({ school_email });
    if (emailExist) {
        throw new CustomError.BadRequestError('Email Already Exist');
    }

    const schoolIdExist = await User.findOne({ school_id });
    if (schoolIdExist) {
        throw new CustomError.BadRequestError('School Id Already Exist');
    }

    if(isAgreedToTerms === false){
        throw new CustomError.BadRequestError('You must agree to the terms and conditions of PAUCS to proceed with the registration');
        
    }

    const firstAccount = await User.countDocuments({}) === 0;
    const role = firstAccount? 'admin' : 'student';


    //verification for email
    // this is the token for confirmation email
    // importing node package crypto to hash token
    const verificationToken = crypto.randomBytes(40).toString('hex');

    let user;

    if (firstAccount === 'admin') {
        // If the role is admin, create an admin user
        const { school_email, password, full_name } = req.body;
        user = await User.create({
            school_id,
            school_email,
            password,
            full_name,
            gender,
            birthdate,
            address,
            profile_image,
            cover_image,
            role: ['admin'],
            status,
            verificationToken,
            isAgreedToTerms
        });
    } else {
        // If the role is student, create a student user
        user = await User.create({
            school_id,
            school_email,
            password,
            school_campus,
            college_dept,
            full_name,
            course,
            year,
            section,
            gender,
            birthdate,
            profile_image,
            address,
            orf_image,
            cover_image,
            role: ['student'],
            status,
            freeUnifStatus,
            verificationToken,
            isAgreedToTerms
        });
    }

  
    const origin =  process.env.ORIGIN;
    // const origin = 'http://localhost:3000'
    // const origin = 'https://paucs.store'


    //after creating the user now it will validate/confirm email
    //sending email
    await sendVerificationEmail({
        name: user.full_name,
        school_email: user.school_email,
        verificationToken: user.verificationToken,
        origin
    })

    res.status(StatusCodes.CREATED).json({ msg: 'Please check your email to verify your account'});
};


const verifyEmail =  async(req, res) => {
    const {verificationToken, school_email} = req.body;

    //check user using email, if not exist the throw error
    const user = await User.findOne({school_email})
    if(!user){
        throw new CustomError.UnauthenticatedError('Verification Failed')
    }

    if(user.verificationToken !== verificationToken){
        throw new CustomError.UnauthenticatedError('Verification failed')
    }

    //if correct set
    user.isVerified = true
    user.verified = Date.now()
    user.verificationToken = ''
    await user.save()


    res.status(StatusCodes.OK).json({mag: 'Email Verified'});
}




const login = async (req, res) => {
    const { school_id, password, recaptchaToken } = req.body;

    //Verify reCAPTCHA token
    const secretKey = process.env.CAPTCHA_KEY;

    if (!secretKey) {
        throw new CustomError.BadRequestError('reCAPTCHA secret key is missing or invalid');
    }

    if (!recaptchaToken) {
        throw new CustomError.BadRequestError('reCAPTCHA secret key is missing or invalid');
    }
  
    const recaptchaResponse = await axios.post( `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`)

    if (!recaptchaResponse.data.success) {
        const errorDetails = JSON.stringify(recaptchaResponse.data);
        throw new CustomError.BadRequestError('reCAPTCHA verification failed')
    }
    

    // Check if email and password exist in db
    if (!school_id || !password) {
        throw new CustomError.BadRequestError('Please provide email or password');
    }

    // Check user if exist in db, if not throw error
    const user = await User.findOne({ school_id });
    if (!user) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }

   
    if (user.status === 'restricted') {
        const currentTime = moment.utc(); // Current time in UTC
        const restrictionStartTime = moment.utc(user.restrictionStartTime); // Restriction start time in UTC
        const restrictionEndTime = restrictionStartTime.clone().add(2, 'minutes'); // Restriction end time in UTC
        const remainingTime = moment.duration(restrictionEndTime.diff(currentTime)); // Remaining time as a duration
    
        const daysRemaining = remainingTime.days();
        const hoursRemaining = remainingTime.hours();
        const minutesRemaining = remainingTime.minutes();
        const secondsRemaining = remainingTime.seconds();
    
        let dateTimeMessage = '';
    
        if (daysRemaining > 0) {
            dateTimeMessage += `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} `;
        }
        if (hoursRemaining > 0) {
            dateTimeMessage += `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} `;
        }
        if (minutesRemaining > 0) {
            dateTimeMessage += `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} `;
        }
        if (secondsRemaining > 0) {
            dateTimeMessage += `${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} `;
        }
    
        throw new CustomError.UnauthorizedError(
            `Your account is currently restricted. It will be unrestricted in ${dateTimeMessage}`
        );
    }
      


    // Check if password correct, if not throw error
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials, wrong password');
    }

    // Check if user is verified or already verified its email, if not throw error
    if (!user.isVerified) {
        throw new CustomError.UnauthenticatedError('Please verify your email');
    }


    // const userAgentDevice = req.headers['user-agent'];
    // const userIPAddress = req.ip

    // if (user.blockedDevices.includes(userAgentDevice)) {
    //     throw new CustomError.UnauthorizedError('Your device has been blocked. Please contact support for assistance.');
    // }
    

    // if (!user.allowedDevices.includes(userAgentDevice) || !user.ipAddress.includes(userIPAddress)) {
    //     sendLoginAttemptNotification(user, userIPAddress, userAgentDevice);
    //     throw new CustomError.UnauthenticatedError('Unrecognized device, please check your email to confirm it was you');
    // }



    const userAgentString = req.headers['user-agent']; // Get User-Agent string from request headers
    const devices = new UAParser(userAgentString).getDevice();
    const browsers = new UAParser(userAgentString).getBrowser();
    const osUsed = new UAParser(userAgentString).getOS();
    const cpuInfo = os.cpus()
    const cpuModel = cpuInfo[0].model

    // console.log(devices, browsers, osUsed, os.cpus());
    // const result = parser.setUA(userAgentString).getResult();
    // const deviceRes = parser.setUA(userAgentString).getDevice();

    const userAgentDevice = {
        deviceUse: devices.vendor,
        userAgent: userAgentString,
        osUse: osUsed.name,
        browserUse: browsers.name,
        cpuUse: cpuModel,
        deviceType: devices.type,
    };

    if(userAgentDevice.deviceUse === undefined || userAgentDevice.deviceType === undefined ) {
        userAgentDevice.deviceType = 'Desktop'
        userAgentDevice.deviceUse = 'Desktop'

        // userAgentDevice.osUse = 'Desktop'
        // userAgentDevice.browserUse = 'Desktop'
        // userAgentDevice.cpuUse = 'Desktop'
    }
    // || userAgentDevice.osUse === undefined || userAgentDevice.browserUse === undefined || userAgentDevice.cpuUse === undefined
    const msg = 'my device: '

    console.log(user.allowedDevices, msg, userAgentDevice )
    
    // Check if the user's device is in the blocked devices
    const isBlocked = user.blockedDevices.some(device => 
        device.deviceUse === userAgentDevice.deviceUse && 
        device.userAgent === userAgentDevice.userAgent &&
        device.osUse === userAgentDevice.osUse &&
        device.browserUse === userAgentDevice.browserUse &&
        device.cpuUse === userAgentDevice.cpuUse &&
        device.deviceType === userAgentDevice.deviceType
    );
    
    if (isBlocked) {
        throw new CustomError.UnauthorizedError('Your device has been blocked. Please contact support for assistance.');
    }
    

    if(user.isUserTest === false){
        // Check if the user's device is in the allowed devices
        const isAllowed = user.allowedDevices.some(device => 
            device.deviceUse === userAgentDevice.deviceUse && 
            device.userAgent === userAgentDevice.userAgent &&
            device.osUse === userAgentDevice.osUse &&
            device.browserUse === userAgentDevice.browserUse &&
            device.cpuUse === userAgentDevice.cpuUse &&
            device.deviceType === userAgentDevice.deviceType
        );
        
        if (!isAllowed) {
            sendLoginAttemptNotification(user, userAgentDevice.deviceUse, userAgentDevice.userAgent, userAgentDevice.osUse, userAgentDevice.browserUse, userAgentDevice.cpuUse, userAgentDevice.deviceType);
            throw new CustomError.UnauthenticatedError('Unrecognized device, please check your email to confirm it was you');
        }


    }


    

    
  
    // // Check for existing active sessions
    // const activeSessions = await Token.find({ user: user._id, isValid: true });

    // if (activeSessions.length > 0) {
    //     // Notify the user about the login attempt
    //     sendLoginAttemptNotification(user, req.ip, userAgentDevice);
    //     throw new CustomError.UnauthorizedError(`Login failed. User Unauthorized`);
    // }

    // Add the configuration here
    // ...

    const tokenUser = createTokenUser(user);

    // Setup token for refresh and access
    // refreshToken
    let refreshToken = '';

    // Check for existing refreshToken
    const existingToken = await Token.findOne({ user: user._id });

    if (existingToken) {
        const { isValid } = existingToken;
        if (!isValid) {
            throw new CustomError.UnauthenticatedError('Invalid Credentials');
        }

        refreshToken = existingToken.refreshToken;
        attachedCookiesToResponse({ res, user: tokenUser, refreshToken });
        res.status(StatusCodes.OK).json({ msg: 'Login User Successfully,  Already Have Refresh Token', user: tokenUser });
        return;
    }

    // Setup token
    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = { refreshToken, userAgent, ip, user: user._id };
    // Token create
    await Token.create(userToken);

    attachedCookiesToResponse({ res, user: tokenUser, refreshToken });

    console.log(user);
    res.status(StatusCodes.OK).json({ msg: 'Login Credential Submitted Successfully', user: tokenUser });
};



const sendLoginAttemptNotification = async(user, deviceUse, userAgent, osUse, browserUse, cpuUse, deviceType) => {
    

    const origin =  process.env.ORIGIN;
    // const origin = 'http://localhost:3000'
    //const origin = 'https://paucs.store'

    await sendLoginAttempEmail({
        name: user.full_name,
        school_email: user.school_email,
        dateLog: new Date(),
        userAgent: userAgent,
        deviceUse: deviceUse,
        osUse: osUse,
        browserUse: browserUse,
        cpuUse: cpuUse,
        deviceType: deviceType,
        school_id: user.school_id,
        origin
      
    })


};



const manageDevices = async (req, res) => {
    const { action, userAgent, deviceUse, school_id, osUse, browserUse, cpuUse, deviceType} = req.query;

    const user = await User.findOne({ school_id });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userAgentDevice = {
        userAgent: userAgent,
        deviceUse: deviceUse,
        osUse: osUse,
        browserUse: browserUse,
        cpuUse: cpuUse,
        deviceType: deviceType,
    };

    if (action === 'allow') {
        
        const isDeviceAllowed = user.allowedDevices.some(device =>
            device.deviceUse === userAgentDevice.deviceUse && 
            device.userAgent === userAgentDevice.userAgent &&
            device.osUse === userAgentDevice.osUse &&
            device.browserUse === userAgentDevice.browserUse &&
            device.cpuUse === userAgentDevice.cpuUse &&
            device.deviceType === userAgentDevice.deviceType
        );
        
        if (isDeviceAllowed) {
            return res.status(400).json({ message: 'Device already allowed for this user' });
        }

       
        user.blockedDevices = user.blockedDevices.filter(device =>
            device.deviceUse !== userAgentDevice.deviceUse || 
            device.userAgent !== userAgentDevice.userAgent ||
            device.osUse !== userAgentDevice.osUse ||
            device.browserUse !== userAgentDevice.browserUse ||
            device.cpuUse !== userAgentDevice.cpuUse ||
            device.deviceType !== userAgentDevice.deviceType
        );

      
        user.allowedDevices.push(userAgentDevice);

    } else if (action === 'block') {
       
        const isDeviceBlocked = user.blockedDevices.some(device =>
            device.deviceUse === userAgentDevice.deviceUse && 
            device.userAgent === userAgentDevice.userAgent &&
            device.osUse === userAgentDevice.osUse &&
            device.browserUse === userAgentDevice.browserUse &&
            device.cpuUse === userAgentDevice.cpuUse &&
            device.deviceType === userAgentDevice.deviceType
        );

        if (isDeviceBlocked) {
            return res.status(400).json({ message: 'Device already blocked for this user' });
        }

     
        user.allowedDevices = user.allowedDevices.filter(dev =>
            dev.deviceUse !== userAgentDevice.deviceUse || 
            dev.userAgent !== userAgentDevice.userAgent ||
            dev.osUse !== userAgentDevice.osUse ||
            dev.browserUse !== userAgentDevice.browserUse ||
            dev.cpuUse !== userAgentDevice.cpuUse ||
            dev.deviceType !== userAgentDevice.deviceType
        );

       
        user.blockedDevices.push(userAgentDevice);

    } else {
        return res.status(400).json({ message: 'Invalid action. Please specify either "allow" or "block".' });
    }


    await user.save();

    const tokenUser = createTokenUser(user);
    attachedCookiesToResponse({ res, user: tokenUser });

    return res.status(200).json({ message: `Device ${action}ed successfully` });
};






//======================================



// const logout = async(req, res)=> {

//     await Token.findOneAndDelete({user: req.user.userId})

//     res.cookie('accessToken', 'logout',{
//         httpOnly:true,
//         expires: new Date(Date.now() + 1000),
//     })

//     res.cookie('refreshToken', 'logout', {
//         httpOnly: true,
//         expires: new Date(Date.now() + 1000),
//     });

//     res.status(StatusCodes.OK).json({msg: 'logout user'})
// }

const logout = async (req, res) => {
    const userId = req.user.userId;

    const user = await User.findById(userId);

//    await User.findByIdAndUpdate(userId, { isConfiguredAnswered: false }).exec();
//    const updatedUser = await User.findById(userId);

    user.isConfiguredAnswered = false
    await user.save()


    await Token.findOneAndDelete({ user: userId });

    res.cookie('accessToken', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now() + 1000),
    });

    res.cookie('refreshToken', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now() + 1000),
    });

    res.status(StatusCodes.OK).json({ msg: 'Logout user', user});
};



const forgotPassword = async(req, res) => {
    const {school_email} = req.body
    if (!school_email) {
        throw new CustomError.BadRequestError('Please provide valid school email');

        }

        const user = await User.findOne({ school_email })

        if(!user){
        throw new CustomError.UnauthenticatedError('Invalid Credentials');
        }
    
    
    if(user){
        const passwordToken = crypto.randomBytes(70).toString('hex')
        // send email  [miliseconds/seconds/minutes]

        const origin =  process.env.ORIGIN;
        // const origin = 'http://localhost:3000'
        // const origin = 'https://paucs.store'
        await sendResetPasswordEmail({
            name:user.full_name, 
            school_email:user.school_email, 
            token:passwordToken, 
            origin
        })


        const tenMinutes = 1000 * 60 * 10
        const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes)

        user.passwordToken = createHash(passwordToken)
        user.passwordTokenExpirationDate = passwordTokenExpirationDate

        await user.save()

    }
    
    
    res.status(StatusCodes.OK).json({msg: 'Please check your email for reset password link'})
}



const resetPassword = async(req, res) => {
    const {token, school_email, password} = req.body
  
    if (!token || !school_email || !password) {
        throw new CustomError.BadRequestError('Please provide all values');
  
    }
  
    const user = await User.findOne({school_email})
    if(user){
        const currentDate = new Date()
        if(user.passwordToken === createHash(token) && user.passwordTokenExpirationDate > currentDate){
            user.password = password
            user.passwordToken = null
            user.passwordTokenExpirationDate = null
            await user.save()
        }
    }
    res.status(StatusCodes.OK).json({msg: 'reset password'})
}


const validateConfigureSettings = async(req, res) => {
   
    const { configureQuestion } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
        throw new CustomError.NotFoundError(`User not found for id ${userId}`);
    }

    // here is to update isConfiguredAnswered to true when answers are valid
    await User.findByIdAndUpdate(
        req.params.id,
        { isConfiguredAnswered: true },
        { new: true }
    );

    // Retrieve the updated user after both update operations
    const updatedUser = await User.findById(req.params.id);


    const tokenUser = createTokenUser(updatedUser);

    // setup token for refresh and access
    // refreshToken
    let refreshToken = '';

    // Check if configuredSettings is true
    if (user.configuredSettings) {
        if (!configureQuestion || !Array.isArray(configureQuestion) || configureQuestion.length === 0) {
            throw new CustomError.BadRequestError('Please provide configure question array');
        }

        // Check if answers match user's configured answers
        const isValidConfiguration = configureQuestion.every(
            (config) =>
                user.configureQuestion.find(
                    (userConfig) =>
                        userConfig.answer === config.answer
                )
        );

        if (!isValidConfiguration) {
            throw new CustomError.UnauthenticatedError('Invalid Answer');
        }
    }

 
    // user.isConfiguredAnswered = true
    // await user.save()

  

    // check for existing refreshToken
    const existingToken = await Token.findOne({
        user: user._id
    });

    if (existingToken) {
        const { isValid } = existingToken;
        if (!isValid) {
            throw new CustomError.UnauthenticatedError('Invalid Credentials');
        }

        refreshToken = existingToken.refreshToken;
        attachedCookiesToResponse({ res, user: tokenUser, refreshToken });
        res.status(StatusCodes.OK).json({ msg: 'Login User Successfully, Already Submitted Configure Answer', user: tokenUser });
        return;
    }

    // setup token
    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = { refreshToken, userAgent, ip, user: user._id };
    // token create
    await Token.create(userToken);

    attachedCookiesToResponse({ res, user: tokenUser, refreshToken });

    res.status(StatusCodes.OK).json({ msg: 'Configure Answer Submitted Successfully', user: tokenUser});


}


const getConfigureQuestion = async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
        throw new CustomError.NotFoundError(`User not found for id ${userId}`);
    }

    const configureQuestions = user.configureQuestion
        .map(config => ({
            question: config.question,
            answer: config.answer
        }));

    res.status(StatusCodes.OK).json({ configureQuestions });
};


const addConfigureSettings = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new CustomError.NotFoundError(`User not found for id ${req.params.id}`);
    }

    // First update operation
    await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    // user.configuredSettings = true
    // await user.save()

    // Second update operation
    await User.findByIdAndUpdate(
        req.params.id,
        { configuredSettings: true },
        { new: true }
    );

    // Retrieve the updated user after both update operations
    const updatedUser = await User.findById(req.params.id);

    const tokenUser = createTokenUser(updatedUser);
    attachedCookiesToResponse({ res, user: tokenUser });

    res.status(StatusCodes.OK).json({user: tokenUser});
};



module.exports = {
    register,
    verifyEmail,
    logout,
    login,
    forgotPassword,
    resetPassword,
    validateConfigureSettings,
    addConfigureSettings,
    getConfigureQuestion,
    manageDevices
}