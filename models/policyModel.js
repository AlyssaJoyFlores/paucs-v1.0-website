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
    },
    profile: {
        type: String
    },
    policy_publisher: {
        type: String
    }
},{timestamps: true})


module.exports = mongoose.model('Policy', PolicySchema)