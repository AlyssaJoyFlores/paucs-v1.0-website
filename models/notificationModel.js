const mongoose = require('mongoose');
const moment = require('moment');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: { 
        type: String, 
        enum: ['unread', 'read'],
        default: 'unread'
    },
    announcement_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Announcement',
    },
    profile: {
        type: String,
    },
    product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
    },
    policy_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Policy',
    }
    
}, {timestamps: true})

// Add a virtual property for formatted time
notificationSchema.virtual('formattedCreatedAt').get(function() {
    return moment(this.createdAt).fromNow();
});

// Set the virtual property to include in the JSON representation of the document
notificationSchema.set('toJSON', { virtuals: true });

const userOrderNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: { 
        type: String, 
        enum: ['unread', 'read'],
        default: 'unread'
    },
    profile: {
        type: String,
    },
    product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
    },
    checkout_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CheckOut',
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
}, {timestamps: true})

// Add a virtual property for formatted time
userOrderNotificationSchema.virtual('formattedCreatedAt').get(function() {
    return moment(this.createdAt).fromNow();
});

// Set the virtual property to include in the JSON representation of the document
userOrderNotificationSchema.set('toJSON', { virtuals: true });


const adminNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    profile: {
        type: String,
    },
    status: { 
        type: String, 
        enum: ['unread', 'read'],
        default: 'unread'
    },
    category: {
        type: String,
        enum: ['order', 'review', 'stocks']
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
    },
    checkout_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CheckOut',
    },
}, {timestamps: true})

// Add a virtual property for formatted time
adminNotificationSchema.virtual('formattedCreatedAt').get(function() {
    return moment(this.createdAt).fromNow();
});

// Set the virtual property to include in the JSON representation of the document
adminNotificationSchema.set('toJSON', { virtuals: true });


const Notification = mongoose.model('Notification', notificationSchema)
const OrderNotification = mongoose.model('OrderNotification', userOrderNotificationSchema)
const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema)


module.exports = {
    Notification,
    OrderNotification,
    AdminNotification
}