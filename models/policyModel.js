const mongoose = require('mongoose')


const PolicySchema = new mongoose.Schema({
    steps: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{timestamps: true})


module.exports = mongoose.model('Policy', PolicySchema)