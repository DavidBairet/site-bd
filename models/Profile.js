const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({

    aboutText: {
        type: String,
        default: ''
    },

    profileImage: {
        type: String,
        default: ''
    },

    contactEmail: {
        type: String,
        default: 'danslaforetfanzine@gmail.com'
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Profile', profileSchema);