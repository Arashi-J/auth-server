const { response } = require('express');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');


const crearUsuario = async (req, res = response) => {

    const { email, name, password } = req.body;

    try {

        //Verificar el email para
        const usuario = await Usuario.findOne({ email });

        if (usuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Email ya registrado'
            });
        }

        // crear usuario con el modelo
        const dbUser = new Usuario(req.body);

        //Hashear la contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync(password, salt);

        //Generar el JWT
        const token = await generarJWT(dbUser.uid, name);

        // Crear usuario de base de datos
        await dbUser.save()

        //Generar Respuesta exitosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name,
            email,
            token
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: "Error en el servidor"
        });
    }
}


const loginUsuario = async (req, res = response) => {

    const { email, password } = req.body;

    try {

        const dbUser = await Usuario.findOne({ email });

        // Verificar si el usuario existe
        if (!dbUser) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo no existe'
            });
        }

        // Validar Password
        const validPassword = bcrypt.compareSync(password, dbUser.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'El password no es correcto'
            });
        }

        //Generar el JWT
        const token = await generarJWT(dbUser.id, dbUser.name);

        //Respuesta del servicio
        return res.json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            token
        });

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }
}

const revalidarToken = async(req, res = response) => {

    const { uid } = req;

    //Leer base de datos para obtener el email
    const dbUser = await Usuario.findById(uid);

    // Generar el JWT
    const token = await generarJWT(uid, dbUser.name);

    return res.json({
        ok: true,
        uid,
        name: dbUser.name,
        email: dbUser.email,
        token
    });
}

module.exports = {
    crearUsuario,
    loginUsuario,
    revalidarToken
}