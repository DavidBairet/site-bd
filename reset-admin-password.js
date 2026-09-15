require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

const Admin = require('./models/Admin');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function resetPassword() {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log('✅ MongoDB connecté');


        rl.question(
            'Identifiant admin : ',
            (username) => {

                rl.question(
                    'Nouveau mot de passe : ',
                    async (password) => {

                        try {

                            const admin =
                                await Admin.findOne({
                                    username: username
                                });


                            if (!admin) {

                                console.log(
                                    '❌ Administrateur introuvable'
                                );

                                return;

                            }


                            const passwordHash =
                                await bcrypt.hash(
                                    password,
                                    12
                                );


                            admin.passwordHash =
                                passwordHash;


                            await admin.save();


                            console.log(
                                '✅ Mot de passe admin modifié'
                            );


                        } catch (error) {

                            console.error(
                                '❌ Erreur :',
                                error
                            );

                        } finally {

                            rl.close();

                            await mongoose.disconnect();

                        }

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            '❌ Erreur MongoDB :',
            error
        );

        rl.close();

    }

}


resetPassword();