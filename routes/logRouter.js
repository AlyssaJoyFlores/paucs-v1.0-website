// logRouter.js
const express = require('express');
const router = express.Router();


const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {logController, getAdminLogs} = require('../controllers/logController');



// Log route
router.route('/adminLogs').post(authenticateUser, logController)
router.route('/getAdminLogs').get(authenticateUser, getAdminLogs)


module.exports = router;
