const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    getAbout,
    createAbout,
    updateAbout,
    deleteAbout,
    archivedAbout,
    getSizeChart,
    createSizeChart,
    updateSizeChart,
    deleteSizeChart,
    uploadSizeChartImage,
    updateSizeChartImage,
    archivedSizeChart,
    getTerms,
    createTerms,
    updateTerms,
    deleteTerms,
    archivedTerms,
    getPrivacy,
    createPrivacy,
    updatePrivacy,
    deletePrivacy,
    archivedPrivacy,
    getHelpSupport,
    createHelpSupport,
    updateHelpSupport,
    deleteHelpSupport,
    archivedHelpSupport
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

//archived
router.route('/archivedAbout/:id').patch([authenticateUser, authorizePermissions('admin')], archivedAbout)
router.route('/archivedSizeChart/:id').patch([authenticateUser, authorizePermissions('admin')], archivedSizeChart)
router.route('/archivedTerms/:id').patch([authenticateUser, authorizePermissions('admin')], archivedTerms)
router.route('/archivedHelpSupport/:id').patch([authenticateUser, authorizePermissions('admin')], archivedHelpSupport)
router.route('/archivedPrivacy/:id').patch([authenticateUser, authorizePermissions('admin')], archivedPrivacy)

module.exports = router