const mongoose = require('mongoose');

const AboutSchema = new mongoose.Schema({
    about_title: {
        type: String
    },
    about_description: {
        type: String
    }
}, {timestamps: true})


const SizeChartSchema = new mongoose.Schema({
    chart_title: {
        type: String
    },
    chart_image: {
        type: String
    }
},{timestamps: true})


const TermsSchema = new mongoose.Schema({
    term_title: {
        type: String
    },
    term_description: {
        type: String
    }
},{timestamps: true})


const PrivacySchema = new mongoose.Schema({
    privacy_title: {
        type: String
    },
    privacy_description: {
        type: String
    }
},{timestamps: true})



const About = mongoose.model('About', AboutSchema)
const SizeChart = mongoose.model('SizeChart', SizeChartSchema)
const Terms = mongoose.model('Terms', TermsSchema)
const Privacy = mongoose.model('Privacy', PrivacySchema)

module.exports = {
    About,
    SizeChart,
    Terms,
    Privacy
}