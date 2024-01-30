const mongoose = require('mongoose')

const adminLogSchema = new mongoose.Schema({
    user: String,
    action: String,
    content: String,
}, {timestamps: true})



module.exports = mongoose.model('AdminLogs', adminLogSchema)