const express = require('express');
const router = express.Router()

// for authentication and permission
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    overallSearchAdmin,
    overallSearchStudent,
    searchOrders
} = require('../controllers/searchController')



router.route('/overallSearchAdmin').get([authenticateUser, authorizePermissions('admin')], overallSearchAdmin)
router.route('/searchOrders').get([authenticateUser, authorizePermissions('admin')], searchOrders)
router.route('/overallSearchStudent/:college_dept').get(authenticateUser, overallSearchStudent)


module.exports = router