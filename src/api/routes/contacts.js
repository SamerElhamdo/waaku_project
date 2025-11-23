const express = require('express')
const { saveContactHandler, blockContactHandler, unblockContactHandler } = require('../controllers/contact')
const router = express.Router()

// Save or edit contact in phone address book
router.post('/', saveContactHandler)
router.post('/block', blockContactHandler)
router.post('/unblock', unblockContactHandler)

module.exports = router
