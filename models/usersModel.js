const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const configureSchema = new mongoose.Schema({
    question: {
        type: String
    },
    answer: {
        type: String
    }
})

const usersSchema = new mongoose.Schema({
    school_id: {
        type: Number,
    },
    school_email: {
        type: String,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email address'
        },
        required: true
    },
    password: {
        type: String,
        required: true
        
    },
    school_campus: {
        type: String,
        enum: ['main', 'south', 'san jose'],
        default: 'south',
        // required: true
        
    },
    college_dept: {
        type: String,
        enum: ['CITE', 'CMA', 'CCJE', 'CAS', 'SHS'],
    },
    full_name: {
        type: String,
        required: true
        
    },
    course: {
        type: String,
        enum: ['BSIT', 'BSEE', 'BSCE', 'BSCRIM', 'BSBA', 'BSA', 'BSED', 'ABM', 'HUMMS'],
    },
    year: {
        type: String,
        enum: ['GR 11','GR 12','1ST YR', '2ND YR', '3RD YR', '4TH YR'],
    },
    section: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['female', 'male'],
    },
    birthdate: {
        type: Date,
    },
    address: {
        type: String,
    },
    orf_image: {
        type: String
    },
    profile_image: {
        type: String
    },
    cover_image: {
        type: String
    },
    role: {
        type: [String],
        enum: ['admin', 'student'],
        default: ['student']
    },
    status: {
        type: String,
        enum: ['unrestricted', 'restricted'],
        default: 'unrestricted'
    },
    verificationToken: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    isOrfVerified: {
        type: Boolean,
        default: false
    },
    isVoucherUse: {
        type: Boolean,
        default: false
    },
    freeUnifStatus: {
        type: String,
        enum: ['freeUnif', 'alreadyClaimed', 'none'],
        default: 'none'
    },
    verified: Date,
    passwordToken: {
        type: String,
    },
    passwordTokenExpirationDate: {
        type: Date
    },
    configuredSettings: {
        type: Boolean,
        default: false
    },
    configureQuestion: [configureSchema],
    isConfiguredAnswered: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})






usersSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

usersSchema.methods.comparePassword = async function(candidatePassword){
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return isMatch;
}


module.exports = mongoose.model('User' , usersSchema);
