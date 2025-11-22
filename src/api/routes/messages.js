const express = require('express')
const { validateNumberHandler, sendMessageHandler } = require('../controllers/message')
const { getChats, getChatMessages, sendChatMessage, downloadMessageMedia, getSession } = require('../whatsapp/session')

const router = express.Router()

// Validate number for a session
router.post('/:id/validate', validateNumberHandler)

// Send a message for a session
router.post('/:id/send', sendMessageHandler)

// Get all chats for a session
router.get('/:id/chats', async (req, res) => {
	try {
		const sessionId = req.params.id
		const chats = await getChats(sessionId)
		res.json(chats)
	} catch (error) {
		console.error(`[API] Error getting chats for session ${req.params.id}:`, error)
		res.status(500).json({ error: error.message || 'Failed to get chats' })
	}
})

// Get messages for a specific chat
router.get('/:id/chats/:chatId/messages', async (req, res) => {
	try {
		const sessionId = req.params.id
		const chatId = req.params.chatId
		const limit = parseInt(req.query.limit) || 50
		
		const messages = await getChatMessages(sessionId, chatId, limit)
		res.json(messages)
	} catch (error) {
		console.error(`[API] Error getting messages for chat ${req.params.chatId}:`, error)
		res.status(500).json({ error: error.message || 'Failed to get messages' })
	}
})

// Send message to a specific chat
router.post('/:id/chats/:chatId/send', async (req, res) => {
	try {
		const sessionId = req.params.id
		const chatId = req.params.chatId
		const { message } = req.body

		if (!message || !message.trim()) {
			return res.status(400).json({ error: 'message required' })
		}

		const result = await sendChatMessage(sessionId, chatId, message.trim())
		res.json(result)
	} catch (error) {
		console.error(`[API] Error sending message to chat ${req.params.chatId}:`, error)
		res.status(500).json({ error: error.message || 'Failed to send message' })
	}
})

// Download media for a specific message
router.get('/:id/chats/:chatId/messages/:messageId/media', async (req, res) => {
	try {
		const sessionId = req.params.id
		const chatId = req.params.chatId
		const messageId = req.params.messageId
		
		const media = await downloadMessageMedia(sessionId, chatId, messageId)
		res.json(media)
	} catch (error) {
		console.error(`[API] Error downloading media for message ${req.params.messageId}:`, error)
		res.status(500).json({ error: error.message || 'Failed to download media' })
	}
})

module.exports = router
