const QRCode = require('qrcode')
const {
	createSession,
	listSessions,
	getSession,
	getSessionHealth,
	getAllSessionsHealth,
	deleteSession: removeSession,
	exportSession,
	importSession,
} = require('../whatsapp/session')
const { getIO } = require('../socket')

// Create new session
async function createSessionHandler(req, res) {
	try {
		const { id } = req.body
		if (!id) return res.status(400).json({ error: 'id required' })
		await createSession(id)
		const io = getIO()
		if (io) io.emit('sessions:update', listSessions())
		res.json({ success: true, id })
	} catch (err) {
		console.error('[CREATE] Error:', err)
		res.status(500).json({ error: err.message || 'Failed to create session' })
	}
}

// List sessions
function listSessionsHandler(req, res) {
	res.json(listSessions())
}

// Get QR for session
async function getQrHandler(req, res) {
	const s = getSession(req.params.id)
	if (!s) return res.status(404).json({ error: 'not found' })
	if (!s.qr) return res.json({ qr: null })
	const qrImage = await QRCode.toDataURL(s.qr)
	res.json({ qr: qrImage })
}

// Health check for all sessions
function getAllHealthHandler(req, res) {
	try {
		const healthData = getAllSessionsHealth()
		// Always return 200 and embed الحالة بدل قطع الواجهة بـ 503
		res.status(200).json({
			status: healthData.overallHealth ? 'healthy' : 'unhealthy',
			...healthData,
		})
	} catch (err) {
		res.status(500).json({
			status: 'error',
			error: err.message,
			timestamp: new Date(),
		})
	}
}

// Health check for specific session
function getOneHealthHandler(req, res) {
	try {
		const sessionHealth = getSessionHealth(req.params.id)
		if (sessionHealth.status === 'not_found') {
			return res.status(404).json(sessionHealth)
		}
		// لا نعيد 503 لتفادي كسر الواجهة؛ نبقي الحالة داخل الجسم
		res.status(200).json(sessionHealth)
	} catch (err) {
		res.status(500).json({
			status: 'error',
			error: err.message,
			timestamp: new Date(),
		})
	}
}

// Restart a specific session
async function restartSessionHandler(req, res) {
	try {
		const id = req.params.id
		const session = getSession(id)
		if (!session) {
			return res.status(404).json({ error: 'Session not found' })
		}
		if (session.client) {
			await session.client.destroy()
		}
		await createSession(id)
		res.json({
			success: true,
			message: 'Session restarted successfully',
			sessionId: id,
			timestamp: new Date(),
		})
		const io = getIO()
		if (io) io.emit('sessions:update', listSessions())
	} catch (err) {
		res.status(500).json({
			error: err.message,
			timestamp: new Date(),
		})
	}
}

// Delete a session
async function deleteSessionHandler(req, res) {
	try {
		const id = req.params.id
		const session = getSession(id)
		if (!session) return res.status(404).json({ error: 'Session not found' })
		await removeSession(id)
		res.json({ success: true, id })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

// Export a session
async function exportSessionHandler(req, res) {
	try {
		const id = req.params.id
		const includeCache = req.query.cache !== 'false' // Default to true
		
		const exportData = await exportSession(id, includeCache === true)
		res.json(exportData)
	} catch (err) {
		console.error('[EXPORT] Error:', err)
		res.status(500).json({ error: err.message || 'Failed to export session' })
	}
}

// Import a session
async function importSessionHandler(req, res) {
	try {
		const exportData = req.body
		const newSessionId = req.body.newSessionId || null
		
		if (!exportData || !exportData.auth) {
			return res.status(400).json({ error: 'Invalid export data' })
		}
		
		const result = await importSession(exportData, newSessionId)
		res.json(result)
	} catch (err) {
		console.error('[IMPORT] Error:', err)
		res.status(500).json({ error: err.message || 'Failed to import session' })
	}
}

module.exports = {
	createSessionHandler,
	listSessionsHandler,
	getQrHandler,
	getAllHealthHandler,
	getOneHealthHandler,
	restartSessionHandler,
	deleteSessionHandler,
	exportSessionHandler,
	importSessionHandler,
}
