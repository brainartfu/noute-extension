const express = require('express');
const router = express.Router();
const noteCtrl = require('../controllers/note.controller');
const verifyToken = require('../middleware/verifytoken');
router.post('/sync', noteCtrl.sync);
router.get('/update/:site', verifyToken, noteCtrl.update);
router.get('/disconnect/:site', verifyToken, noteCtrl.disconnect);
router.post('/collection/:site/note/store', verifyToken,  noteCtrl.noteStore)
router.get('/collection/:site', verifyToken,  noteCtrl.getCollection)
router.post('/note/:id/status', verifyToken,  noteCtrl.statusNote)
router.post('/note/:id/update', verifyToken,  noteCtrl.updateNote)
router.post('/note/:id/delete', verifyToken,  noteCtrl.deleteNote)
router.post('/note/:id/pinned', verifyToken,  noteCtrl.pinnedNote)
router.post('/note/:id/reply/store', verifyToken,  noteCtrl.replyStore)
router.post('/reply/:id/update', verifyToken,  noteCtrl.replyUpdate)
router.post('/reply/:id/delete', verifyToken,  noteCtrl.replyDelete)
module.exports = router;