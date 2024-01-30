// logController.js
const adminLogModel = require('../models/adminLogModel');

const logController = async (req, res, next) => {
  try {
    console.log('Request object:', req);
    // Extract user, action, and timestamp from the log message
    const logData = {
      user: req.user ? req.user.full_name : 'guest',
      action: req.logAction || '-',
    };

    // Save the log to MongoDB
    await adminLogModel.create(logData);
    next();
  } catch (error) {
    console.error('Error logging:', error);
    next();
  }
};


const getAdminLogs = async(req, res) => {
    const log = await adminLogModel.find({}).sort({createdAt: -1})
    res.status(200).json({log})
}

module.exports = {
    logController,
    getAdminLogs
};
