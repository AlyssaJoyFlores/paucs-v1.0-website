const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')


const {
    getNotifications,
    getAdminNotification,
    updateNotifications,
    updateOrderNotifications,
    updateAdminNotifications
} = require('../controllers/notificationController')


router.route('/getNotifications').get(authenticateUser, getNotifications)
router.route('/getAdminNotification').get(authenticateUser, getAdminNotification)

router.route('/updateNotifications/:id').patch(authenticateUser, updateNotifications)
router.route('/updateOrderNotifications/:id').patch(authenticateUser, updateOrderNotifications)
router.route('/updateAdminNotifications/:id').patch(authenticateUser, updateAdminNotifications)

module.exports = router