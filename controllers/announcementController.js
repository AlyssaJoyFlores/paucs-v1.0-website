const Announcement = require('../models/announcementModel')
const {Notification, OrderNotification} = require('../models/notificationModel')
const AdminLog = require('../models/adminLogModel')
const User = require('../models/usersModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// to get all announcements
const getAllAnnouncements = async(req, res) => {
    let queryObject = {};

    if(req.query.category){
        queryObject.categories = req.query.category
    }

    const announcements = await Announcement.find(queryObject).sort({createdAt: -1})

    res.status(StatusCodes.OK).json({announcements})
}


// search announcements
const searchAnnouncements = async(req, res) => {
    //insert pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const skip = (page - 1) * pageSize;

     const {search} = req.query
     const queryObject = {}
 
     if(search){
        queryObject.$or = [
            { anncmnt_title: { $regex: search, $options: 'i' } },
            { anncmnt_description: { $regex: search, $options: 'i' } },
        ];
     }
 
    let announcement = await Announcement.find(queryObject)
    .collation({ locale: 'en', strength: 2 })
    .sort('prod_name')
    .skip(skip)
    .limit(pageSize)
    .exec()

    let searchTotal = await Announcement.find(queryObject)
 
     res.status(StatusCodes.OK).json({announcement, count: searchTotal.length})
}

const addAnnouncement = async (req, res) => {
    req.logAction = 'Add Announcement';

    const { anncmnt_title, anncmnt_description, image, anncmnt_date, categories } = req.body;
  
    if (!anncmnt_title || !anncmnt_description) {
      throw new CustomError.BadRequestError('title and description are required');
    }
  
    const user = await User.findById(req.user.userId);
  
    if (!user) {
      throw new CustomError.NotFoundError('Admin not found');
    }
  
    const announcement = await Announcement.create({
      anncmnt_title,
      anncmnt_description,
      image,
      anncmnt_date,
      categories,
      profile_image: user.profile_image,
      anncmnt_publisher: user.full_name,
      user: req.user.userId,
    });
  
    // Create a notification
    const notification = await Notification.create({
      title: 'New Announcement',
      message: `${anncmnt_title}`,
      profile: `${user.profile_image}`,
      announcement_id: announcement._id,
    });
  

    const notifications = await Notification.find({}).sort({ createdAt: -1 });

  
    io.emit('newAnnouncement', { notifications });

    await AdminLog.create({
        user: req.user.full_name,
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${announcement.anncmnt_title} has been added`
    })
  
    res.status(StatusCodes.CREATED).json({ announcement, notification });
};
  


// to update announcement
const updateAnnouncement = async(req, res) => {
    req.logAction = 'Update Announcement';
   
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        // res.status(404)
        // throw new Error("No announcement found");
        throw new CustomError.NotFoundError('No announcement found')
    }

    const updateAnnouncement = await Announcement.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )


    await AdminLog.create({
        user: req.user.full_name,
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${updateAnnouncement.anncmnt_title} has been updated`
    })

    res.status(StatusCodes.OK).json({updateAnnouncement})
}


// to delete announcement
const deleteAnnouncement = async (req, res) => {
    req.logAction = 'Delete Announcement';

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        throw new CustomError.NotFoundError('No announcement found')
    }

   
    try {
        if (announcement.image) {
            const publicId = announcement.image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }

    await Announcement.deleteOne({ _id:announcement});

    await AdminLog.create({
        user: req.user.full_name,
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${announcement.anncmnt_title} has been removed`
    })

    res.status(StatusCodes.OK).json({ message: "Announcement deleted", announcement });
};


// to upload image in cloudinary
const uploadAnnImage = async(req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(200).json({ message: 'announcement without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        use_filename:true,
        folder:'announcement-folder'
    })

    fs.unlinkSync(req.files.image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}

// to udpate image in cloudinary
const uploadUpdateAnnImage = async (req, res) => {
  
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
        return res.status(404).json({ error: "No announcement found" });
    }

    try {
        if (announcement.image) {
            const publicId = announcement.image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

    if (!req.files || !req.files.image) {
        return res.status(200).json({ message: 'announcement without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        use_filename: true,
        folder: 'announcement-folder'
    });


    fs.unlinkSync(req.files.image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}



module.exports = {
    getAllAnnouncements,
    searchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadAnnImage,
    uploadUpdateAnnImage
}