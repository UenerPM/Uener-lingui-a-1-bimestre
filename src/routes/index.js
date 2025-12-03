const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const linguicaRoutes = require('./linguicaRoutes');
const sessionRoute = require('./sessionRoute');

router.use('/', sessionRoute);
router.use('/', userRoutes);
router.use('/', linguicaRoutes);

module.exports = router;
