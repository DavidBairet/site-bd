const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    coverImage: {
        type: String,
        required: true
    },

    pdfFile: {
        type: String,
        required: true
    },

    downloadable: {
        type: Boolean,
        default: false
    },

    published: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comic', comicSchema);