const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    createPolicy,
    getAllPolicy,
    updatePolicy,
    deletePolicy
} = require('../controllers/policyController')


router.route('/createPolicy').post([authenticateUser, authorizePermissions('admin')], createPolicy)
router.route('/getAllPolicy').get(getAllPolicy)
router.route('/updatePolicy/:id').patch([authenticateUser, authorizePermissions('admin')], updatePolicy)
router.route('/deletePolicy/:id').delete([authenticateUser, authorizePermissions('admin')], deletePolicy)


module.exports = router