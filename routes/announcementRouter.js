// dependencies
const express = require('express');

// invoke
const router = express.Router();

// for authentication and permission
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')


// import
const {
    getAllAnnouncements,
    searchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadAnnImage,
    uploadUpdateAnnImage
} = require('../controllers/announcementController')


// routes
router.route('/getAnnouncements').get(authenticateUser, getAllAnnouncements);
router.route('/search').get(authenticateUser, searchAnnouncements);

router.route('/uploadImage').post([authenticateUser, authorizePermissions('admin')] , uploadAnnImage);
router.route('/addAnnouncement').post([authenticateUser, authorizePermissions('admin')] , addAnnouncement);

router.route('/updateAnnouncement/:id').patch([authenticateUser, authorizePermissions('admin')] , updateAnnouncement);
router.route('/uploadUpdate/:id').post([authenticateUser, authorizePermissions('admin')] , uploadUpdateAnnImage);
router.route('/deleteAnnouncement/:id').delete([authenticateUser, authorizePermissions('admin')] , deleteAnnouncement);


//export
module.exports = router;