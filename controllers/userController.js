const User = require('../models/usersModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, checkPermissions} = require('../utils')

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


const showCurrentUser = async(req, res) => {
  // req.user.role = [req.user.role];
  console.log(req.user)
  // res.status(StatusCodes.OK).json({user: req.user});
  res.status(StatusCodes.OK).json(req.user);
}


const updateUser = async (req, res) => {
 const user = await User.findById(req.params.id)

  if(!user){
    throw new CustomError.NotFoundError(`User not found for id ${user}`)
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  )

  const tokenUser = createTokenUser(updateUser);
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



module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  verifiedOrf,
  searchUsers
}


