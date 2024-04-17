const User = require('../models/usersModel')
const AdminLog = require('../models/adminLogModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const crypto = require('crypto')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, sendVerificationEmail, sendResetPasswordEmail, sendLoginAttempEmail, createHash} = require('../utils')
const moment = require('moment');
const UAParser = require('ua-parser-js');
const os = require('os')


const archivedUser = async(req, res) => {
    
  const user = await User.findById(req.params.id);

  if (!user) {
      throw new CustomError.NotFoundError('No help support found')
  }

  const updateUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
  )

  if(updateUser.isArchived === true) {
      req.logAction = 'Archived User';
      req.action = 'archived'
  } 

  if(updateUser.isArchived === false) {
      req.logAction = 'Unarchived User';
      req.action = 'unarchived'
  }

  
  await AdminLog.create({
      user: req.user.full_name,
      action: `${req.user.full_name} ${req.logAction}`,
      content: `Size Chart: ${user.full_name} has been ${req.action}`
  })


  res.status(StatusCodes.OK).json({updateUser})
}

const getAllUsers = async(req, res) => {
const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;

  const { college_dept, course, year, isOrfVerified } = req.query;
  const searchQuery = req.query.search;

  
  const filterConditions = {};

  if(req.query.isArchived) {
    filterConditions.isArchived = req.query.isArchived === 'true'
  }

  if (college_dept) filterConditions.college_dept = college_dept;
  if (course) filterConditions.course = course;
  if (year) filterConditions.year = year;
  if (isOrfVerified) filterConditions.isOrfVerified = isOrfVerified;

  if (searchQuery) {
    filterConditions.$or = [
      { full_name: { $regex: searchQuery, $options: 'i' } },
      { school_id: { $regex: searchQuery, $options: 'i' } },
      { college_dept: { $regex: searchQuery, $options: 'i' } },
      { course: { $regex: searchQuery, $options: 'i' } },
    ];

     
  }



  const users = await User.find({...filterConditions })
    .select('-password')
    .sort({ full_name: 1 })
    .skip(skip)
    .limit(pageSize)
    .where('role')
    .equals('student')
    .exec();

    const overAllUser = await User.countDocuments();
    const totalUser = users.length
    const totalPages = Math.ceil(totalUser / pageSize);

  res.status(StatusCodes.OK).json({ users, overAllUser, totalUser, totalPages });

}

const searchUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;

  const { college_dept, course } = req.query;
  const searchQuery = req.query.search;

  const filterConditions = {};

  
  if(req.query.isArchived) {
    filterConditions.isArchived = req.query.isArchived === 'true'
  }

  if (college_dept) filterConditions.college_dept = college_dept;
  if (course) filterConditions.course = course;

  if (searchQuery) {
    filterConditions.$or = [
      { full_name: { $regex: searchQuery, $options: 'i' } },
      { school_id: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  

  const users = await User.find({ role: 'student', ...filterConditions })
    .select('-password')
    .sort({ full_name: 1 })
    .skip(skip)
    .limit(pageSize)
    .exec();

  const overAllUser = await User.countDocuments();
  const totalUser = users.length
  const totalPages = Math.ceil(totalUser / pageSize);
  
  res.status(StatusCodes.OK).json({ users, overAllUser, totalUser, totalPages });

};


 
// const page = parseInt(req.query.page) || 1;
// const pageSize = parseInt(req.query.pageSize) || 12;
// const skip = (page - 1) * pageSize;

// const users = await User.find({role: 'student'})
// .sort({ full_name: 1 })
// .select('-password')
// .skip(skip)
// .limit(pageSize)
// .exec();

// const totalUser = await User.countDocuments(users)
// const totalPages = Math.ceil(totalUser / pageSize);


// res.status(StatusCodes.OK).json({users, totalUser, totalPages})


const getSingleUser = async(req, res) => {
  const user = await User.findOne({_id: req.params.id }).select('-password')
  if (!user) {
      throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
    }
    //checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({msg: 'get single user', user})
}



const showCurrentUser = async (req, res) => {
  const user = req.user;
  
 
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

  const isBlocked = user.blockedDevices.some(device => 
    device.deviceUse === userAgentDevice.deviceUse && 
    device.userAgent === userAgentDevice.userAgent &&
    device.browserUse === userAgentDevice.browserUse &&
    device.osUse === userAgentDevice.osUse &&
    device.cpuUse === userAgentDevice.cpuUse &&
    device.deviceType === userAgentDevice.deviceType
  );
  
  if (isBlocked) {
    res.cookie('accessToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
    });

    res.cookie('refreshToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
    });

    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Your device has been blocked. Please contact support for assistance.'
    });
  

  }

 
  // const student = req.user.role.includes("student")
  // if (!req.user.isOrfVerified && student|| req.user.isOrfVerified === false && student || req.user.isOrfVerified === null && student ) {
  //   req.user.message = "Please update your ORF";
  // }

  if (req.user.isOrfVerified === true) {
    const verificationEnd = moment.utc(req.user.verificationEnd);
    const now = moment.utc()
    const duration = moment.duration(verificationEnd.diff(now));
    const remainingDays = duration.days();
    const remainingHours = duration.hours();
    const remainingMinutes = duration.minutes();
    const remainingSeconds = duration.seconds();

    req.user.countdown = {
      days: remainingDays,
      hours: remainingHours,
      minutes: remainingMinutes,
      seconds: remainingSeconds
    };
  }

  res.status(StatusCodes.OK).json(req.user);
}





// const showCurrentUser = async (req, res) => {
//   const { userId } = req.user;

//   try {
//       // Retrieve the latest user data from the database
//       const user = await User.findById(userId);

//       if (!user) {
//           throw new CustomError.NotFoundError('User not found');
//       }

//       const userAgentDevice = req.headers['user-agent'];

//       // Check if the user's device is blocked
//       if (user.blockedDevices.includes(userAgentDevice)) {
//           // Invalidate cookies
//           res.cookie('accessToken', 'logout', {
//               httpOnly: true,
//               expires: new Date(Date.now() + 1000),
//           });

//           res.cookie('refreshToken', 'logout', {
//               httpOnly: true,
//               expires: new Date(Date.now() + 1000),
//           });

//           return res.status(StatusCodes.FORBIDDEN).json({
//               message: 'Your device has been blocked. Please contact support for assistance.'
//           });
//       }

//       // Check if the user's device is allowed
//       if (!user.allowedDevices.includes(userAgentDevice)) {
//           // Invalidate cookies
//           res.cookie('accessToken', 'logout', {
//               httpOnly: true,
//               expires: new Date(Date.now() + 1000),
//           });

//           res.cookie('refreshToken', 'logout', {
//               httpOnly: true,
//               expires: new Date(Date.now() + 1000),
//           });

//           throw new CustomError.UnauthenticatedError('Your device is not allowed. Please check your email to confirm it was you.');
//       }

//       // Respond with the updated user object
//       res.status(StatusCodes.OK).json(user);
//   } catch (error) {
//       // Handle errors
//       console.error('Error fetching user data:', error);
//       throw new CustomError.InternalServerError('Failed to fetch user data');
//   }
// };



const showCurrentUsers = async (req, res) => {
  const user = req.user;
  
    
  const userAgentDevice = {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };

  const isBlocked = user.blockedDevices.some(device => 
    device.ipAddress === userAgentDevice.ipAddress && device.userAgent === userAgentDevice.userAgent
  );
  
  if (isBlocked) {
    res.cookie('accessToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
    });

    res.cookie('refreshToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
    });

    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Your device has been blocked. Please contact support for assistance.'
    });
  

  }

  if (req.user.enrollmentStart) {
  const enrollmentStart = moment(req.user.enrollmentStart);
  const expirationDate = enrollmentStart.clone().add(2, 'minutes'); // Add 1 year to enrollment start date
  req.user.expirationDate = expirationDate.toDate();

  const currentDate = moment();
  if (currentDate.isAfter(expirationDate)) {
    // If already expired, update orf_image to clear
    req.user.orf_image = '';
    req.user.message = 'Your ORF has expired. Please update it.';
  } else {
    // Calculate remaining time until expiration
    const remainingTime = moment.duration(expirationDate.diff(currentDate));
    const countdown = {
      years: remainingTime.years(),
      months: remainingTime.months(),
      days: remainingTime.days(),
      hours: remainingTime.hours(),
      minutes: remainingTime.minutes(),
      seconds: remainingTime.seconds()
    };
    req.user.countdown = countdown;
  }
} else {
  // If enrollmentStart is not provided, ask the user to update their ORF
  req.user.message = 'Please update your ORF';
}

  res.status(StatusCodes.OK).json(req.user);

};



const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new CustomError.NotFoundError(`User not found for id ${user}`);
  }

  if (req.body.status) {
    user.status = 'restricted';
    user.restrictionStartTime = new Date();

    await user.save();

    setTimeout(async () => {
      const updatedUser = await User.findById(req.params.id);
      if (updatedUser) {
        updatedUser.status = 'unrestricted';
        updatedUser.restrictionStartTime = null
        await updatedUser.save();
      }
    },  2 * 60 * 1000); // 2 days in milliseconds
  }

  if (req.body.status === 'unrestricted'){
    const updatedUser = await User.findById(req.params.id);
      if (updatedUser) {
        updatedUser.restrictionStartTime = null
        await updatedUser.save();
      }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  const tokenUser = createTokenUser(updatedUser);
  attachedCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};





const updateUserPassword = async(req, res) => {

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError('Please provide both values');
  }

  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
}


const deleteUser = async(req, res)=> {
  const user = await User.findById(req.params.id)

  if(!user){
    throw new CustomError.NotFoundError('No user found')
  }

  await User.deleteOne({_id:user})

  res.status(StatusCodes.OK).json({ msg: 'User Deleted Successfully', user});
}



const verifiedOrf = async(req, res) => {

  const user = await User.findById(req.params.id)

  if(!user){
    throw new CustomError.NotFoundError(`User not found for id ${user}`)
  }

  if(user.year === '1ST YR'){
    await User.findByIdAndUpdate(
      req.params.id,
      {freeUnifStatus: 'freeUnif'},
      {new:true}
    )
  }

  if(req.body.isOrfVerified === true) {
    user.verificationStart = moment();
    await user.save();

    const verificationEnd = moment(req.body.verificationEnd);
    const delayInMillis = verificationEnd.diff(moment());

    setTimeout(async() => {
      const updateUser = await User.findByIdAndUpdate(req.params.id)
      if(updateUser){
        updateUser.isOrfVerified = false
        updateUser.verificationStart = ""
        updateUser.verificationEnd = ""
        updateUser.orf_image = ""
        await updateUser.save()
      }
    }, delayInMillis)
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  )
  

  const tokenUser = createTokenUser(updateUser);
  attachedCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
}


const registerUser = async (req, res) => {
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
      orf_image,
      profile_image,
      cover_image,
      role // Add role parameter
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


  //verification for email
  // this is the token for confirmation email
  // importing node package crypto to hash token
  const verificationToken = crypto.randomBytes(40).toString('hex');

  let user;

  if (role === 'admin') {
      // If the role is admin, create an admin user
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
          isVerified: true,
          isAgreedToTerms: true
          
      });
  } else if (role === 'student') {
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
          address,
          orf_image,
          profile_image,
          cover_image,
          role: ['student'],
          status,
          freeUnifStatus,
          isVerified: true,
          isAgreedToTerms: true
      });
  } else {
      throw new CustomError.BadRequestError('Invalid role specified');
  }

  user.verified = Date.now()
  await user.save()
  res.status(StatusCodes.CREATED).json({ msg: 'Account Created Successfully' });
}


const verifiedMultipleOrf = async (req, res) => {
  const userIds = req.body.userIds;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid or empty user IDs provided." });
  }


  const updatedUsers = [];

  for (const userId of userIds) {
    const user = await User.findById(userId);

    if (!user) {
      throw new CustomError.NotFoundError(`User not found for id ${userId}`);
    }

    if (user.year === '1ST YR') {
      await User.findByIdAndUpdate(
        userId,
        { freeUnifStatus: 'freeUnif' },
        { new: true }
      );
    }

    if (req.body.isOrfVerified === true) {
      user.verificationStart = moment();
      await user.save();

      const verificationEnd = moment(req.body.verificationEnd);
      const delayInMillis = verificationEnd.diff(moment());

      setTimeout(async () => {
        const updateUser = await User.findByIdAndUpdate(userId);
        if (updateUser) {
          updateUser.isOrfVerified = false;
          updateUser.verificationStart = "";
          updateUser.verificationEnd = "";
          updateUser.orf_image = "";
          await updateUser.save();
        }
      }, delayInMillis);
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );

    updatedUsers.push(updateUser);
  }

  const tokenUsers = updatedUsers.map(updateUser => createTokenUser(updateUser));

  res.status(StatusCodes.OK).json({ users: tokenUsers });

};



module.exports = {
  archivedUser,
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  verifiedOrf,
  searchUsers,
  registerUser,
  verifiedMultipleOrf
}


