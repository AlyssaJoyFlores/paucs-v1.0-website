// dependencies
const express = require('express');

// invoke
const router = express.Router();

// for authentication and permission
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')


// import
const {
    getSingleAnnouncement,
    getAllAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    archiveAnnouncement,
    uploadAnnImage,
    uploadUpdateAnnImage
} = require('../controllers/announcementController')


// routes
router.route('/getAnnouncements').get(authenticateUser, getAllAnnouncements);


router.route('/uploadImage').post([authenticateUser, authorizePermissions('admin')] , uploadAnnImage);
router.route('/addAnnouncement').post([authenticateUser, authorizePermissions('admin')] , addAnnouncement);

router.route('/getSingleAnnouncement/:id').get(authenticateUser, getSingleAnnouncement);

router.route('/updateAnnouncement/:id').patch([authenticateUser, authorizePermissions('admin')] , updateAnnouncement);
router.route('/archiveAnnouncement/:id').patch([authenticateUser, authorizePermissions('admin')] , archiveAnnouncement);

router.route('/uploadUpdate/:id').post([authenticateUser, authorizePermissions('admin')] , uploadUpdateAnnImage);
router.route('/deleteAnnouncement/:id').delete([authenticateUser, authorizePermissions('admin')] , deleteAnnouncement);


//export
module.exports = router;