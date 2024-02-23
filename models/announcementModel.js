const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    anncmnt_title: {
        type: String,
        required: true,
    },
    anncmnt_description: {
        type:String,
        required: true
    },
    image:{
        type: String,
    },
    anncmnt_date: {
        type: Date,
        default: Date.now(),
        required: true
    },
    profile_image: {
        type: String,
        required: true,
    },
    anncmnt_publisher: {
         type: String,
        required: true,
    },
    categories: {
        type: String,
        enum: ['materials', 'products']
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Announcements', announcementSchema)