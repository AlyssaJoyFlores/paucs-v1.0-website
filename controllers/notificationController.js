
const {Notification, OrderNotification, AdminNotification}  = require('../models/notificationModel')
const {StatusCodes} = require('http-status-codes')
const Product = require('../models/productModel')
const User = require('../models/usersModel')
const CustomError = require('../errors')
const moment = require('moment');


const getNotifications = async (req, res) => {
    const { category } = req.query;
    const queryObject = {};

    if (category) {
        queryObject.category = category;
    }
      
    const userId = req.user.userId;

    //delete notif if already 1 week ago
    const oneWeekAgo = moment().subtract(1, 'weeks');
    await Notification.deleteMany({ createdAt: { $lt: oneWeekAgo }, status: 'read' });
    await OrderNotification.deleteMany({ createdAt: { $lt: oneWeekAgo }, status: 'read' });


    //if already one month and still unread it must also be deleted
    const oneMonthAgo = moment().subtract(1, 'months');
    await Notification.deleteMany({ createdAt: { $lt: oneMonthAgo }, status: 'unread' });
    await OrderNotification.deleteMany({ createdAt: { $lt: oneMonthAgo }, status: 'unread' });
    


    const userNotifications = await OrderNotification.find({userId}).sort({ createdAt: -1 });
    const usercountUnread = await OrderNotification.find({userId, status: 'unread' });
    
   
    const notifications = await Notification.find(queryObject).sort({createdAt: -1})
    const countUnread = await Notification.countDocuments(queryObject, {status: 'unread'})

    
    const totalnotif = countUnread.length + usercountUnread.length

    res.status(StatusCodes.OK).json({ notifications, userNotifications, count: countUnread, usercount: usercountUnread.length, totalnotif});
 
};



const getAdminNotification = async(req, res) => {
   
    //delete notif if already 1 week ago
    const oneWeekAgo = moment().subtract(1, 'weeks');
    await AdminNotification.deleteMany({ createdAt: { $lt: oneWeekAgo }, status: 'read' });
    

    //if already one month and still unread it must also be deleted
    const oneMonthAgo = moment().subtract(1, 'months');
    await AdminNotification.deleteMany({ createdAt: { $lt: oneMonthAgo }, status: 'unread' });

    //for testing purposes
    // const twoMinutesAgo = moment().subtract(5, 'minutes');
    // await AdminNotification.deleteMany({ createdAt: { $lt: twoMinutesAgo } });

    
    const adminNotifications = await AdminNotification.find({category: 'order'}).sort({ createdAt: -1 });
    const admincountUnread = await AdminNotification.find({category: 'order', status: 'unread'})

    const adminReviewNotifications = await AdminNotification.find({category: 'review'}).sort({ createdAt: -1 });
    const adminreviewcountUnread = await AdminNotification.find({category: 'review', status: 'unread'})

    const adminStockNotifications = await AdminNotification.find({category: 'stocks'}).sort({ createdAt: -1 });
    const adminstockcountUnread = await AdminNotification.find({category: 'stocks', status: 'unread'})

    const totalAdminNotif = admincountUnread.length + adminreviewcountUnread.length + adminstockcountUnread.length

    
    // const products = await Product.find({ 'categories.ctgy_stocks': { $lt: 5 } });

    // for (const product of products) {
    //     const existingNotifications = await AdminNotification.find({
    //         product_id: product._id,
    //         category: 'stocks',
    //     });

    //     for (const category of product.categories) {
    //         // Check if there is an existing notification for the current category
    //         const existingNotification = existingNotifications.find(
    //             (notification) => notification.message === `${category.ctgy_selection} currently has ${category.ctgy_stocks} stocks`
    //         );

    //         // If no existing notification, create one
    //         if (!existingNotification && category.ctgy_stocks < 5) {
    //             const stockNotification = await AdminNotification.create({
    //                 title: `${product.prod_name} is currently low on stock`,
    //                 message: `${category.ctgy_selection} currently has ${category.ctgy_stocks} stocks`,
    //                 profile: `${product.image}`,
    //                 category: 'stocks',
    //                 product_id: product._id,
                
    //             });
    //         }
    //     }
    // }

    // const stockNotifications = await AdminNotification.find({}).sort({ createdAt: -1 });

    // io.emit('stockNotification', { stockNotifications });

    
    res.status(StatusCodes.OK).json({ 
        adminNotifications, 
        admincount: admincountUnread.length,
        adminReviewNotifications,
        adminreviewcount: adminreviewcountUnread.length,
        adminStockNotifications,
        adminstockcount: adminstockcountUnread.length,
        totalAdminNotif
    });
}


const updateNotifications = async(req, res) => {
   
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        throw new CustomError.NotFoundError('No Notification found')
    }

    const updateNotifications = await Notification.findByIdAndUpdate(
        req.params.id,
        // req.body,
        { status: 'read' },
        {new:true}
    )
    const updatedNotification = await Notification.find({})
    

    io.emit('notificationUpdated', {updatedNotification})

    res.status(StatusCodes.OK).json({updateNotifications})
}



const updateOrderNotifications = async(req, res) => {
   
    const ordernotification = await OrderNotification.findById(req.params.id);

    if (!ordernotification) {
        // res.status(404)
        // throw new Error("No announcement found");
        throw new CustomError.NotFoundError('No Order Notification Found')
    }

    const updateOrderNotifications = await OrderNotification.findByIdAndUpdate(
        req.params.id,
        // req.body,
        { status: 'read' },
        {new:true}
    )
    const updatedOrderNotification = await OrderNotification.find({})
    

    io.emit('notificationOrderUpdated', {updatedOrderNotification})

    res.status(StatusCodes.OK).json({updateOrderNotifications})
}


const updateAdminNotifications = async(req, res) => {
       
    const adminnotification = await AdminNotification.findById(req.params.id);

    if (!adminnotification) {
        throw new CustomError.NotFoundError('No Admin Notification Found')
    }

    // if (adminnotification.status !== 'read') {
    //     // Update the status to 'read'
    //     adminnotification.status = 'read';
    //     await adminnotification.save();
    // }


    const updateAdminNotifications = await AdminNotification.findByIdAndUpdate(
        req.params.id,
        // req.body,
        { status: 'read' },
        {new:true}
    )
    const updateAdminNotification = await AdminNotification.find({})
    

    io.emit('notificationAdminUpdated', {updateAdminNotification})

    res.status(StatusCodes.OK).json({updateAdminNotifications})
}




module.exports = {
    getNotifications,
    getAdminNotification,
    updateNotifications,
    updateOrderNotifications,
    updateAdminNotifications
  
}