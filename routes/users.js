const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.render('index', { users });
    } catch (error) {
        res.status(500).send('Error al obtener la lista de usuarios');
    }
});

router.post('/', [
    // Validar que el nombre no esté vacío
    body('name').notEmpty().withMessage('El nombre es requerido'),
    // Validar que el email sea un email válido
    body('email').isEmail().withMessage('Ingrese un email válido'),
    // Validar que la contraseña tenga al menos 6 caracteres
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    // Extraer los errores de la validación
    const errors = validationResult(req);

    // Verificar si hay errores de validación
    if (!errors.isEmpty()) {
        // Si hay errores, retornar un objeto JSON con los errores
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        await newUser.save();
        res.redirect('/users');
    } catch (error) {
        res.status(500).send('Error al crear el usuario');
    }
});

router.get('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.render('partials/edit', { user });
    } catch (error) {
        res.status(500).send('Error al obtener el usuario');
    }
});

router.post('/update/:id', async (req, res) => {
    try {
        // Verificar si se proporcionó una nueva contraseña
        if (req.body.password) {
            // Generar un hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword; // Reemplazar la contraseña con la nueva contraseña cifrada
        }

        await User.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/users');
    } catch (error) {
        res.status(500).send('Error al actualizar el usuario');
    }
});

router.get('/delete/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users');
    } catch (error) {
        res.status(500).send('Error al eliminar el usuario');
    }
});

module.exports = router;
