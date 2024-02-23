const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    getAbout,
    createAbout,
    updateAbout,
    deleteAbout,
    getSizeChart,
    createSizeChart,
    updateSizeChart,
    deleteSizeChart,
    uploadSizeChartImage,
    updateSizeChartImage,
    getTerms,
    createTerms,
    updateTerms,
    deleteTerms,
    getPrivacy,
    createPrivacy,
    updatePrivacy,
    deletePrivacy,
    getHelpSupport,
    createHelpSupport,
    updateHelpSupport,
    deleteHelpSupport
} = require('../controllers/infoController')

// get
router.route('/getAbout').get(getAbout)
router.route('/getSizeChart').get(getSizeChart)
router.route('/getTerms').get(getTerms)
router.route('/getPrivacy').get(getPrivacy)
router.route('/getHelpSupport').get(getHelpSupport)

// post
router.route('/createAbout').post([authenticateUser, authorizePermissions('admin')], createAbout)
router.route('/createSizeChart').post([authenticateUser, authorizePermissions('admin')], createSizeChart)
router.route('/uploadSizeChartImage').post([authenticateUser, authorizePermissions('admin')], uploadSizeChartImage)
router.route('/createTerms').post([authenticateUser, authorizePermissions('admin')], createTerms)
router.route('/createPrivacy').post([authenticateUser, authorizePermissions('admin')], createPrivacy)
router.route('/createHelpSupport').post([authenticateUser, authorizePermissions('admin')], createHelpSupport)
router.route('/updateSizeChartImage/:id').post([authenticateUser, authorizePermissions('admin')], updateSizeChartImage)


// patch
router.route('/updateAbout/:id').patch([authenticateUser, authorizePermissions('admin')], updateAbout)
router.route('/updateSizeChart/:id').patch([authenticateUser, authorizePermissions('admin')], updateSizeChart)
router.route('/updateTerms/:id').patch([authenticateUser, authorizePermissions('admin')], updateTerms)
router.route('/updatePrivacy/:id').patch([authenticateUser, authorizePermissions('admin')], updatePrivacy)
router.route('/updateHelpSupport/:id').patch([authenticateUser, authorizePermissions('admin')], updateHelpSupport)

// delete
router.route('/deleteAbout/:id').delete([authenticateUser, authorizePermissions('admin')], deleteAbout)
router.route('/deleteSizeChart/:id').delete([authenticateUser, authorizePermissions('admin')], deleteSizeChart)
router.route('/deleteTerms/:id').delete([authenticateUser, authorizePermissions('admin')], deleteTerms)
router.route('/deletePrivacy/:id').delete([authenticateUser, authorizePermissions('admin')], deletePrivacy)
router.route('/deleteHelpSupport/:id').delete([authenticateUser, authorizePermissions('admin')], deleteHelpSupport)

module.exports =  router