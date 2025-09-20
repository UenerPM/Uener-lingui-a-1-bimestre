const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');

// Multer config para salvar imagens em public/img
const upload = multer({ dest: path.join(__dirname, '..', '..', 'public', 'img') });

// Users
router.get('/usuarios', adminController.listUsers);
router.post('/usuarios', adminController.createUser);
router.delete('/usuarios/:username', adminController.deleteUser);
router.patch('/usuarios/:username/bloquear', adminController.toggleBlock);
router.patch('/usuarios/:username/promover', adminController.promote);
router.patch('/usuarios/:username/despromover', adminController.demote);

// Linguiças CRUD (exemplo 1: CRUD sem dependências)
router.get('/linguicas', adminController.listLinguicas);
router.post('/linguicas', upload.single('imagem'), adminController.createLinguica);
router.put('/linguicas/:id', upload.single('imagem'), adminController.updateLinguica);
router.delete('/linguicas/:id', adminController.deleteLinguica);

module.exports = router;
