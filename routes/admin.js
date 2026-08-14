const express = require('express');
const multer = require('multer');
const path = require('path');
const Comic = require('../models/Comic');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'coverImage') {
            cb(null, 'public/uploads/covers/');
        } else {
            cb(null, 'public/uploads/pdf/');
        }
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage
});

router.get('/', async (req, res) => {
    const comics = await Comic.find().sort({ createdAt: -1 });

    res.render('admin/dashboard', {
        comics
    });
});

router.get('/bd/ajouter', (req, res) => {
    res.render('admin/add-comic');
});

router.post(
    '/bd/ajouter',
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'pdfFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const comic = new Comic({
                title: req.body.title,
                description: req.body.description,

                coverImage:
                    '/uploads/covers/' +
                    req.files.coverImage[0].filename,

                pdfFile:
                    '/uploads/pdf/' +
                    req.files.pdfFile[0].filename,

                downloadable:
                    req.body.downloadable === 'on',

                published:
                    req.body.published === 'on'
            });

            await comic.save();

            res.redirect('/admin');
        } catch (error) {
            console.error(error);
            res.status(500).send('Erreur lors de l’ajout de la BD');
        }
    }
);

module.exports = router;