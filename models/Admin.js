const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({

    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },

    passwordHash: {
        type: String,
        default: null
    },

    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'CLIENT_ADMIN'],
        required: true
    },

    accountConfigured: {
        type: Boolean,
        default: false
    },

    activationTokenHash: {
        type: String,
        default: null
    },

    activationTokenExpires: {
        type: Date,
        default: null
    },

    resetPasswordTokenHash: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Admin', adminSchema);