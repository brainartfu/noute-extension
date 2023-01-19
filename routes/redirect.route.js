const express = require('express');
const router = express.Router();
const noteCtrl = require('../controllers/note.controller');
router.get('/:site', noteCtrl.redirectURL);
module.exports = router;