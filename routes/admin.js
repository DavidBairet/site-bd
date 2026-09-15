const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const Comic = require('../models/Comic');
const Admin = require('../models/Admin');
const Profile = require('../models/Profile');

const router = express.Router();


// =========================
// MIDDLEWARE AUTH
// =========================

function requireAuth(req, res, next) {

    if (!req.session.adminId) {
        return res.redirect('/admin/login');
    }

    next();
}


// =========================
// CONNEXION
// =========================

router.get('/login', (req, res) => {

    if (req.session.adminId) {
        return res.redirect('/admin');
    }

    res.render('admin/login', {
        error: null
    });

});


router.post('/login', async (req, res) => {

    try {

      
        const { login, password } = req.body;


        const admin = await Admin.findOne({
            $or: [
                { username: login },
                { email: login.toLowerCase() }
            ]
        });

        if (!admin || !admin.passwordHash) {

            return res.status(401).render(
                'admin/login',
                {
                    error:
                        'Identifiant ou mot de passe incorrect.'
                }
            );

        }


        const passwordValid =
            await bcrypt.compare(
                password,
                admin.passwordHash
            );


        if (!passwordValid) {

            return res.status(401).render(
                'admin/login',
                {
                    error:
                        'Identifiant ou mot de passe incorrect.'
                }
            );

        }


        req.session.adminId =
            admin._id.toString();

        req.session.adminRole =
            admin.role;


        res.redirect('/admin');


    } catch (error) {

        console.error(
            'Erreur connexion admin :',
            error
        );

        res.status(500).send(
            'Erreur lors de la connexion'
        );

    }

});

// =========================
// MOT DE PASSE OUBLIÉ
// =========================

router.get('/forgot-password', (req, res) => {

    res.render('admin/forgot-password', {
        success: null,
        error: null
    });

});


// =========================
// DEMANDE DE RÉINITIALISATION
// =========================

router.post(
    '/forgot-password',
    async (req, res) => {

        try {

            const email =
                req.body.email
                    ?.trim()
                    .toLowerCase();


            if (!email) {

                return res.status(400).render(
                    'admin/forgot-password',
                    {
                        success: null,
                        error:
                            'Veuillez saisir votre adresse e-mail.'
                    }
                );

            }


            const admin =
                await Admin.findOne({
                    email: email
                });


            /*
             * On affiche le même message
             * même si l'adresse n'existe pas.
             */

            if (!admin) {

                return res.render(
                    'admin/forgot-password',
                    {
                        success:
                            'Si cette adresse e-mail correspond à un compte, un lien de réinitialisation va être envoyé.',
                        error: null
                    }
                );

            }


            // Token envoyé dans le lien

            const resetToken =
                crypto.randomBytes(32)
                    .toString('hex');


            // Hash conservé dans MongoDB

            const resetTokenHash =
                crypto
                    .createHash('sha256')
                    .update(resetToken)
                    .digest('hex');


            admin.resetPasswordTokenHash =
                resetTokenHash;


            // Expiration dans 30 minutes

            admin.resetPasswordExpires =
                new Date(
                    Date.now() +
                    30 * 60 * 1000
                );


            await admin.save();


            // Lien qui sera envoyé par e-mail

            const resetUrl =
                `${process.env.BASE_URL}/admin/reset-password/${resetToken}`;


            /*
             * L'envoi du mail sera ajouté
             * juste après.
             */

            console.log(
                'Lien de réinitialisation généré.'
            );


            res.render(
                'admin/forgot-password',
                {
                    success:
                        'Si cette adresse e-mail correspond à un compte, un lien de réinitialisation va être envoyé.',
                    error: null
                }
            );


        } catch (error) {

            console.error(
                'Erreur mot de passe oublié :',
                error
            );

            res.status(500).render(
                'admin/forgot-password',
                {
                    success: null,
                    error:
                        'Une erreur est survenue. Veuillez réessayer.'
                }
            );

        }

    }
);
// =========================
// DÉCONNEXION
// =========================

router.post(
    '/logout',
    requireAuth,
    (req, res) => {

        req.session.destroy((error) => {

            if (error) {

                console.error(
                    'Erreur déconnexion :',
                    error
                );

            }

            res.redirect('/admin/login');

        });

    }
);


/* =========================
   DOSSIERS UPLOAD
========================= */

const coversDir = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    'covers'
);

const pdfDir = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    'pdf'
);

const profileDir = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    'profile'
);


// Création automatique des dossiers
// s'ils n'existent pas

[
    coversDir,
    pdfDir,
    profileDir

].forEach((directory) => {

    if (!fs.existsSync(directory)) {

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );

    }

});


/* =========================
   MULTER BD
========================= */

const comicStorage =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            if (
                file.fieldname
                === 'coverImage'
            ) {

                cb(
                    null,
                    coversDir
                );

            } else {

                cb(
                    null,
                    pdfDir
                );

            }

        },


        filename: (
            req,
            file,
            cb
        ) => {

            const uniqueName =
                Date.now() +
                '-' +
                Math.round(
                    Math.random() * 1E9
                ) +
                path.extname(
                    file.originalname
                );

            cb(
                null,
                uniqueName
            );

        }

    });


const uploadComic =
    multer({
        storage: comicStorage
    });


/* =========================
   MULTER PHOTO PROFIL
========================= */

const profileStorage =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            cb(
                null,
                profileDir
            );

        },


        filename: (
            req,
            file,
            cb
        ) => {

            const uniqueName =
                Date.now() +
                '-' +
                Math.round(
                    Math.random() * 1E9
                ) +
                path.extname(
                    file.originalname
                );

            cb(
                null,
                uniqueName
            );

        }

    });


const uploadProfile =
    multer({

        storage: profileStorage,

        limits: {
            fileSize: 5 * 1024 * 1024
        },

        fileFilter: (
            req,
            file,
            cb
        ) => {

            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/webp'
            ];


            if (
                allowedTypes.includes(
                    file.mimetype
                )
            ) {

                cb(null, true);

            } else {

                cb(
                    new Error(
                        'Format image non autorisé'
                    )
                );

            }

        }

    });


/* =========================
   DASHBOARD ADMIN
========================= */

router.get(
    '/',
    requireAuth,
    async (req, res) => {

        try {

            const comics =
                await Comic.find()
                    .sort({
                        createdAt: -1
                    });


            res.render(
                'admin/dashboard',
                {
                    comics,
                    adminRole:
                        req.session.adminRole
                }
            );


        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Erreur lors du chargement des BD'
            );

        }

    }
);


/* =========================
   PROFIL / À PROPOS
========================= */

router.get(
    '/profil',
    requireAuth,
    async (req, res) => {

        try {

            let profile =
                await Profile.findOne();


            if (!profile) {

                profile =
                    await Profile.create({
                        aboutText: '',
                        profileImage: '',
                        contactEmail:
                            'danslaforetfanzine@gmail.com'
                    });

            }


            res.render(
                'admin/profile',
                {
                    profile,
                    success: false
                }
            );


        } catch (error) {

            console.error(
                'Erreur profil :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement du profil'
            );

        }

    }
);


/* =========================
   MODIFIER PROFIL
========================= */

router.post(
    '/profil',

    requireAuth,

    uploadProfile.single(
        'profileImage'
    ),

    async (req, res) => {

        try {

            let profile =
                await Profile.findOne();


            if (!profile) {

                profile =
                    new Profile();

            }


            profile.aboutText =
                req.body.aboutText || '';

            profile.contactEmail =
                req.body.contactEmail || '';

            profile.updatedAt =
                new Date();


            /*
             * Suppression volontaire
             * de la photo
             */

            if (
                req.body.deleteProfileImage === 'on' &&
                profile.profileImage
            ) {

                const oldImagePath =
                    path.join(
                        __dirname,
                        '..',
                        'public',
                        profile.profileImage
                    );


                if (
                    fs.existsSync(
                        oldImagePath
                    )
                ) {

                    fs.unlinkSync(
                        oldImagePath
                    );

                }


                profile.profileImage = '';

            }


            /*
             * Nouvelle photo
             */

            if (req.file) {

                /*
                 * Suppression de l'ancienne photo
                 * si elle existe encore
                 */

                if (
                    profile.profileImage
                ) {

                    const oldImagePath =
                        path.join(
                            __dirname,
                            '..',
                            'public',
                            profile.profileImage
                        );


                    if (
                        fs.existsSync(
                            oldImagePath
                        )
                    ) {

                        fs.unlinkSync(
                            oldImagePath
                        );

                    }

                }


                profile.profileImage =
                    '/uploads/profile/' +
                    req.file.filename;

            }


            await profile.save();


            res.render(
                'admin/profile',
                {
                    profile,
                    success: true
                }
            );


        } catch (error) {

            console.error(
                'Erreur modification profil :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du profil'
            );

        }

    }
);

// =========================
// MON COMPTE
// =========================

router.get(
    '/compte',
    requireAuth,
    async (req, res) => {

        try {

            const admin = await Admin.findById(
                req.session.adminId
            );

            if (!admin) {
                return res.redirect('/admin/login');
            }

            res.render(
                'admin/account',
                {
                    admin,
                    success: null,
                    error: null
                }
            );

        } catch (error) {

            console.error(
                'Erreur chargement compte :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement du compte'
            );

        }

    }
);


// =========================
// MODIFIER MON COMPTE
// =========================

router.post(
    '/compte',
    requireAuth,
    async (req, res) => {

        try {

            const {
                username,
                email,
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;


            const admin = await Admin.findById(
                req.session.adminId
            );


            if (!admin) {
                return res.redirect('/admin/login');
            }


            // =========================
            // IDENTIFIANT
            // =========================

            if (!username || !username.trim()) {

                return res.status(400).render(
                    'admin/account',
                    {
                        admin,
                        success: null,
                        error:
                            'L’identifiant est obligatoire.'
                    }
                );

            }

            admin.username = username.trim();


            // =========================
            // ADRESSE E-MAIL
            // =========================

            if (email && email.trim()) {

                admin.email =
                    email.trim().toLowerCase();

            } else {

                admin.email = undefined;

            }


            // =========================
            // CHANGEMENT MOT DE PASSE
            // =========================

            if (
                currentPassword ||
                newPassword ||
                confirmPassword
            ) {

                if (
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                ) {

                    return res.status(400).render(
                        'admin/account',
                        {
                            admin,
                            success: null,
                            error:
                                'Remplis les trois champs pour changer le mot de passe.'
                        }
                    );

                }


                if (!admin.passwordHash) {

                    return res.status(400).render(
                        'admin/account',
                        {
                            admin,
                            success: null,
                            error:
                                'Aucun mot de passe actuel n’est configuré.'
                        }
                    );

                }


                const passwordValid =
                    await bcrypt.compare(
                        currentPassword,
                        admin.passwordHash
                    );


                if (!passwordValid) {

                    return res.status(400).render(
                        'admin/account',
                        {
                            admin,
                            success: null,
                            error:
                                'Le mot de passe actuel est incorrect.'
                        }
                    );

                }


                if (newPassword.length < 8) {

                    return res.status(400).render(
                        'admin/account',
                        {
                            admin,
                            success: null,
                            error:
                                'Le nouveau mot de passe doit contenir au moins 8 caractères.'
                        }
                    );

                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    return res.status(400).render(
                        'admin/account',
                        {
                            admin,
                            success: null,
                            error:
                                'Les nouveaux mots de passe ne correspondent pas.'
                        }
                    );

                }


                admin.passwordHash =
                    await bcrypt.hash(
                        newPassword,
                        12
                    );

            }


            // =========================
            // ENREGISTREMENT
            // =========================

            await admin.save();


            res.render(
                'admin/account',
                {
                    admin,
                    success:
                        'Compte modifié avec succès.',
                    error: null
                }
            );


        } catch (error) {

            console.error(
                'Erreur modification compte :',
                error
            );


            if (error.code === 11000) {

                const admin =
                    await Admin.findById(
                        req.session.adminId
                    );

                return res.status(400).render(
                    'admin/account',
                    {
                        admin,
                        success: null,
                        error:
                            'Cet identifiant ou cette adresse e-mail est déjà utilisé.'
                    }
                );

            }


            res.status(500).send(
                'Erreur lors de la modification du compte'
            );

        }

    }
);



/* =========================
   PAGE AJOUT BD
========================= */

router.get(
    '/bd/ajouter',
    requireAuth,
    (req, res) => {

        res.render(
            'admin/add-comic'
        );

    }
);


/* =========================
   AJOUTER UNE BD
========================= */

router.post(
    '/bd/ajouter',

    requireAuth,

    uploadComic.fields([
        {
            name: 'coverImage',
            maxCount: 1
        },
        {
            name: 'pdfFile',
            maxCount: 1
        }
    ]),

    async (req, res) => {

        try {

            if (
                !req.files ||
                !req.files.coverImage ||
                !req.files.pdfFile
            ) {

                return res
                    .status(400)
                    .send(
                        'La couverture et le PDF sont obligatoires'
                    );

            }


            const comic =
                new Comic({

                    title:
                        req.body.title,

                    description:
                        req.body.description,

                    coverImage:
                        '/uploads/covers/' +
                        req.files
                            .coverImage[0]
                            .filename,

                    pdfFile:
                        '/uploads/pdf/' +
                        req.files
                            .pdfFile[0]
                            .filename,

                    downloadable:
                        req.body.downloadable
                        === 'on',

                    published:
                        req.body.published
                        === 'on'

                });


            await comic.save();


            res.redirect('/admin');


        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Erreur lors de l’ajout de la BD'
            );

        }

    }
);


/* =========================
   SUPPRIMER UNE BD
========================= */

router.post(
    '/bd/:id/supprimer',

    requireAuth,

    async (req, res) => {

        try {

            const comic =
                await Comic.findById(
                    req.params.id
                );


            if (!comic) {

                return res
                    .status(404)
                    .send(
                        'BD introuvable'
                    );

            }


            /*
             * Suppression couverture
             */

            if (
                comic.coverImage
            ) {

                const coverPath =
                    path.join(
                        __dirname,
                        '..',
                        'public',
                        comic.coverImage
                    );


                if (
                    fs.existsSync(
                        coverPath
                    )
                ) {

                    fs.unlinkSync(
                        coverPath
                    );

                }

            }


            /*
             * Suppression PDF
             */

            if (
                comic.pdfFile
            ) {

                const pdfPath =
                    path.join(
                        __dirname,
                        '..',
                        'public',
                        comic.pdfFile
                    );


                if (
                    fs.existsSync(
                        pdfPath
                    )
                ) {

                    fs.unlinkSync(
                        pdfPath
                    );

                }

            }


            /*
             * Suppression MongoDB
             */

            await Comic.findByIdAndDelete(
                req.params.id
            );


            res.redirect('/admin');


        } catch (error) {

            console.error(error);

            res.status(500).send(
                'Erreur lors de la suppression de la BD'
            );

        }

    }
);


module.exports = router;