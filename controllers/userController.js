const User = require('../models/usersModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const crypto = require('crypto')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, sendVerificationEmail, sendResetPasswordEmail, sendLoginAttempEmail, createHash} = require('../utils')

const getAllUsers = async(req, res) => {
const page = parseInt(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;

  const { college_dept, course } = req.query;
  const searchQuery = req.query.search;

  const filterConditions = {};
  if (college_dept) filterConditions.college_dept = college_dept;
  if (course) filterConditions.course = course;

  if (searchQuery) {
    filterConditions.$or = [
      { full_name: { $regex: searchQuery, $options: 'i' } },
      { school_id: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const overAllUser = await User.countDocuments();
  const totalUser = await User.countDocuments(filterConditions);
  const totalPages = Math.ceil(totalUser / pageSize);

  const users = await User.find({ role: 'student', ...filterConditions })
    .select('-password')
    .sort({ full_name: 1 })
    .skip(skip)
    .limit(pageSize)
    .exec();

  res.status(StatusCodes.OK).json({ users, overAllUser, totalUser, totalPages });

}

const searchUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;

  const { college_dept, course } = req.query;
  const searchQuery = req.query.search;

  const filterConditions = {};
  if (college_dept) filterConditions.college_dept = college_dept;
  if (course) filterConditions.course = course;

  if (searchQuery) {
    filterConditions.$or = [
      { full_name: { $regex: searchQuery, $options: 'i' } },
      { school_id: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const overAllUser = await User.countDocuments();
  const totalUser = await User.countDocuments(filterConditions);
  const totalPages = Math.ceil(totalUser / pageSize);

  const users = await User.find({ role: 'student', ...filterConditions })
    .select('-password')
    .sort({ full_name: 1 })
    .skip(skip)
    .limit(pageSize)
    .exec();

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
    checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({msg: 'get single user', user})
}


// const showCurrentUser = async(req, res) => {
//   // req.user.role = [req.user.role];
//   console.log(req.user)
//   // res.status(StatusCodes.OK).json({user: req.user});
//   res.status(StatusCodes.OK).json(req.user);

// }


const showCurrentUser = async (req, res) => {
  const { userId } = req.user;

  try {
      // Retrieve the latest user data from the database
      const user = await User.findById(userId);

      if (!user) {
          throw new CustomError.NotFoundError('User not found');
      }

      const userAgentDevice = req.headers['user-agent'];

      // Check if the user's device is blocked
      if (user.blockedDevices.includes(userAgentDevice)) {
          // Invalidate cookies
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

      // Check if the user's device is allowed
      if (!user.allowedDevices.includes(userAgentDevice)) {
          // Invalidate cookies
          res.cookie('accessToken', 'logout', {
              httpOnly: true,
              expires: new Date(Date.now() + 1000),
          });

          res.cookie('refreshToken', 'logout', {
              httpOnly: true,
              expires: new Date(Date.now() + 1000),
          });

          throw new CustomError.UnauthenticatedError('Your device is not allowed. Please check your email to confirm it was you.');
      }

      // Respond with the updated user object
      res.status(StatusCodes.OK).json(user);
  } catch (error) {
      // Handle errors
      console.error('Error fetching user data:', error);
      throw new CustomError.InternalServerError('Failed to fetch user data');
  }
};


// const showCurrentUser = async (req, res) => {
  
//   const { user } = req;

//   const userAgentDevice = req.headers['user-agent'];
//   if (!user || !user.blockedDevices || !Array.isArray(user.blockedDevices)) {
//     // Handle the case where user or blockedDevices is not defined or is not an array
//     throw new CustomError.NotFoundError('User data is missing or invalid');
//   }

//   // Check if the user's device is blocked
//   if (user.blockedDevices.includes(userAgentDevice)) {
    
//     res.cookie('accessToken', 'logout', {
//       httpOnly: true,
//       expires: new Date(Date.now() + 1000),
//     });

//     res.cookie('refreshToken', 'logout', {
//       httpOnly: true,
//       expires: new Date(Date.now() + 1000),
//     });

//     throw new CustomError.UnauthorizedError('Your device has been blocked. Please contact support for assistance.');
//   }

//   if (!user.allowedDevices.includes(userAgentDevice)) {
//     res.cookie('accessToken', 'logout', {
//       httpOnly: true,
//       expires: new Date(Date.now() + 1000),
//     });

//     res.cookie('refreshToken', 'logout', {
//       httpOnly: true,
//       expires: new Date(Date.now() + 1000),
//     });
//     throw new CustomError.UnauthenticatedError('Your device is not allowed. Please check your email to confirm it was you.');
// }


//   res.status(StatusCodes.OK).json(user);
// };



//============================================
// const updateUser = async (req, res) => {
//  const user = await User.findById(req.params.id)

//   if(!user){
//     throw new CustomError.NotFoundError(`User not found for id ${user}`)
//   }

//   const updateUser = await User.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     {new:true}
//   )

//   const tokenUser = createTokenUser(updateUser);
//   attachedCookiesToResponse({ res, user: tokenUser });

//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };




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

  const userAgent = req.headers['user-agent'];

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
          verificationToken,
          allowedDevices: [userAgent]
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
          verificationToken,
          allowedDevices: [userAgent]
      });
  } else {
      throw new CustomError.BadRequestError('Invalid role specified');
  }

  // const origin = 'http://localhost:3000'
  const origin = 'https://paucs.store'

  //after creating the user now it will validate/confirm email
  //sending email
  await sendVerificationEmail({
    name: user.full_name,
    school_email: user.school_email,
    verificationToken: user.verificationToken,
    origin
  })

  res.status(StatusCodes.CREATED).json({ msg: 'Please check your email to verify your account' });
}



module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  verifiedOrf,
  searchUsers,
  registerUser
}


