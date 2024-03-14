// logController.js
const adminLogModel = require('../models/adminLogModel');
const moment = require('moment');

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
      //delete logs if already 1 week ago
      const oneWeekAgo = moment().subtract(1, 'weeks');
      await adminLogModel.deleteMany({ createdAt: { $lt: oneWeekAgo } });


    const log = await adminLogModel.find({}).sort({createdAt: -1})
    res.status(200).json({log})
}

module.exports = {
    logController,
    getAdminLogs
};
