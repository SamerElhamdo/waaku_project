const { saveContact, blockContact, unblockContact } = require('../whatsapp/session')

async function saveContactHandler(req, res) {
	try {
		const { sessionId, phone, firstName, lastName = '', syncToAddressbook = true } = req.body || {}
		if (!sessionId || !phone || !firstName) {
			return res.status(400).json({ error: 'sessionId, phone, and firstName are required' })
		}
		console.log(`[CONTACT][API] save -> session=${sessionId} phone=${phone} first=${firstName} last=${lastName}`)
		const result = await saveContact(sessionId, {
			phone: String(phone),
			firstName: String(firstName),
			lastName: lastName ? String(lastName) : '',
			syncToAddressbook: syncToAddressbook !== false
		})
		res.json(result)
	} catch (err) {
		res.status(500).json({ error: err.message || 'Failed to save contact' })
	}
}

// Block contact
async function blockContactHandler(req, res) {
	try {
		const { sessionId, phone } = req.body || {}
		if (!sessionId || !phone) {
			return res.status(400).json({ error: 'sessionId and phone are required' })
		}
		console.log(`[CONTACT][API] block -> session=${sessionId} phone=${phone}`)
		const result = await blockContact(sessionId, String(phone))
		res.json(result)
	} catch (err) {
		res.status(500).json({ error: err.message || 'Failed to block contact' })
	}
}

// Unblock contact
async function unblockContactHandler(req, res) {
	try {
		const { sessionId, phone } = req.body || {}
		if (!sessionId || !phone) {
			return res.status(400).json({ error: 'sessionId and phone are required' })
		}
		console.log(`[CONTACT][API] unblock -> session=${sessionId} phone=${phone}`)
		const result = await unblockContact(sessionId, String(phone))
		res.json(result)
	} catch (err) {
		res.status(500).json({ error: err.message || 'Failed to unblock contact' })
	}
}

module.exports = { saveContactHandler, blockContactHandler, unblockContactHandler }
