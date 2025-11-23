const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js')
// Lazy socket accessor to avoid circular imports
const { getIO } = require('../socket')
const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const { createClient } = require('redis')

// Environment-aware Puppeteer runtime selection
const RUNTIME = process.env.WAAKU_RUNTIME || 'linux' // 'linux' (default) | 'mac'
const isLinux = RUNTIME === 'linux'
const isMac = RUNTIME === 'mac'

function buildPuppeteerOptions() {
	const commonArgs = [
		'--no-first-run',
		'--no-default-browser-check',
		'--disable-accelerated-2d-canvas',
		'--disable-software-rasterizer',
		'--window-size=1920,1080',
	]

	const linuxArgs = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
		'--disable-gpu',
		'--no-zygote',
		// Avoid sharing a user data dir across processes to prevent SingletonLock errors
		// Let Chromium pick a temp profile per process
	]

	const macArgs = [
		'--disable-gpu',
		'--disable-dev-shm-usage',
		'--disable-setuid-sandbox',
		'--no-first-run',
		'--no-default-browser-check',
	]

	const options = {
		headless: true,
		args: [...commonArgs, ...(isLinux ? linuxArgs : macArgs)],
	}

	// Set executable path based on runtime
	if (isLinux) {
		options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
	} else if (isMac) {
		// For macOS, use Chrome if available or custom path
		options.executablePath = process.env.WAAKU_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	}

	console.log(`[PUPPETEER] Runtime=${RUNTIME} headless=${options.headless} exec=${options.executablePath || 'auto'}`)
	return options
}

const sessions = {}

// Webhook configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const AUTH_STRATEGY = (process.env.WAAKU_AUTH_STRATEGY || 'local').toLowerCase()
const REDIS_URL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`

let redisClient = null

class RedisSessionStore {
	constructor(redis, clientId) {
		this.redis = redis
		this.clientId = clientId
		this.prefix = `RemoteAuth:${clientId}:`
	}

	async save(data) {
		if (!data) return

		// Mandatory creds
		if (data.creds) {
			await this.redis.set(this.prefix + 'creds', JSON.stringify(data.creds))
		}

		// Mandatory keys: store each key separately to match whatsapp-web.js expectations
		if (data.keys) {
			for (const [k, v] of Object.entries(data.keys)) {
				await this.redis.set(`${this.prefix}keys:${k}`, JSON.stringify(v))
			}
		}
	}

	async extract() {
		const baseCreds = await this.redis.get(this.prefix + 'creds')
		if (!baseCreds) return null

		const keysList = await this.redis.keys(this.prefix + 'keys:*')
		const keys = {}
		for (const redisKey of keysList) {
			const keyName = redisKey.replace(this.prefix + 'keys:', '')
			const raw = await this.redis.get(redisKey)
			try {
				keys[keyName] = JSON.parse(raw)
			} catch (e) {
				console.log('[RemoteAuth] Failed parsing key', keyName)
			}
		}

		return {
			creds: JSON.parse(baseCreds),
			keys
		}
	}

	async delete() {
		const all = await this.redis.keys(this.prefix + '*')
		if (all.length) {
			await this.redis.del(all)
		}
	}
}

async function getRedisClient() {
	if (redisClient) return redisClient
	redisClient = createClient({ url: REDIS_URL })
	redisClient.on('error', (err) => {
		console.error('[REDIS] Connection error:', err.message)
	})
	await redisClient.connect()
	console.log(`[REDIS] Connected at ${REDIS_URL}`)
	return redisClient
}

async function clearRemoteStore(clientId) {
	if (AUTH_STRATEGY !== 'remote') return
	try {
		const redis = await getRedisClient()
		const store = new RedisSessionStore(redis, clientId)
		await store.delete()
		console.log(`[RemoteAuth] Cleared store for ${clientId}`)
	} catch (err) {
		console.warn(`[RemoteAuth] Failed to clear store for ${clientId}:`, err?.message || err)
	}
}

async function buildAuthStrategy(sanitizedId) {
	if (AUTH_STRATEGY !== 'remote') {
		return new LocalAuth({ clientId: sanitizedId })
	}

	try {
		const redis = await getRedisClient()
		const store = new RedisSessionStore(redis, sanitizedId)
		const existing = await store.extract()
		if (existing) {
			console.log(`[RemoteAuth] Restoring session for ${sanitizedId}`)
		} else {
			console.log(`[RemoteAuth] Creating new session for ${sanitizedId}`)
		}

		return new RemoteAuth({
			store: {
				save: async (data) => store.save(data),
				extract: async () => store.extract(),
				delete: async () => store.delete()
			},
			clientId: sanitizedId,
			backupSyncIntervalMs: 300000
		})
	} catch (error) {
		console.error('[AUTH] RemoteAuth init failed, falling back to LocalAuth:', error.message)
		return new LocalAuth({ clientId: sanitizedId })
	}
}

// Function to send webhook notification
async function sendWebhook(eventType, data) {
	if (!WEBHOOK_URL) {
		console.log('[WEBHOOK] No webhook URL configured, skipping...')
		return
	}

	try {
		const payload = {
			event: eventType,
			timestamp: new Date().toISOString(),
			data
		}

		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': 'Waaku-Webhook/1.0'
		}

		// Add webhook secret if configured
		if (WEBHOOK_SECRET) {
			headers['X-Webhook-Secret'] = WEBHOOK_SECRET
		}

		console.log(`[WEBHOOK] Sending ${eventType} to ${WEBHOOK_URL}`)
		const response = await axios.post(WEBHOOK_URL, payload, {
			headers,
			timeout: 10000 // 10 second timeout
		})

		console.log(`[WEBHOOK] ${eventType} sent successfully, status: ${response.status}`)
	} catch (error) {
		console.error(`[WEBHOOK] Failed to send ${eventType}:`, error.message)
	}
}

// Sanitize clientId to only allow alphanumeric, underscores, and hyphens
function sanitizeClientId(id) {
	if (!id) return 'default'
	// Replace any invalid characters with underscores
	// Only keep alphanumeric, underscores, and hyphens
	const sanitized = String(id).replace(/[^a-zA-Z0-9_-]/g, '_')
	// Ensure it's not empty and doesn't start/end with underscore or hyphen
	return sanitized.replace(/^[_-]+|[_-]+$/g, '') || 'default'
}

async function createSession(id) {
	// Sanitize the clientId for LocalAuth (only alphanumeric, underscores, hyphens allowed)
	// Important: Use sanitized ID as the session identifier for consistency with stored sessions
	const sanitizedId = sanitizeClientId(id)
	
	// Use sanitized ID as the session key to ensure consistency with restored sessions
	if (sessions[sanitizedId]) return sessions[sanitizedId]

	const authStrategy = await buildAuthStrategy(sanitizedId)

	const client = new Client({
		authStrategy,
		puppeteer: buildPuppeteerOptions(),
		takeoverOnConflict: false,
		takeoverTimeoutMs: 0,
		restartOnAuthFail: false
	})

	// Initialize session entry early so event handlers can safely write QR/status
	sessions[sanitizedId] = {
		client,
		qr: null,
		ready: false,
		status: 'initializing',
		clientState: null,
		error: null,
		createdAt: new Date(),
		lastActivity: new Date(),
		originalId: id !== sanitizedId ? id : null // Keep track of original ID if it was sanitized
	}

	client.on('qr', (qr) => {
		console.log(`[${sanitizedId}] QR RECEIVED`)
		sessions[sanitizedId].qr = qr
		sessions[sanitizedId].status = 'qr_received'
		sessions[sanitizedId].lastActivity = new Date()
		const io = getIO()
		if (io) {
			// Emit as data URL for direct display on the client
			const QRCode = require('qrcode')
			QRCode.toDataURL(qr)
				.then((dataUrl) => {
					io.emit('session:qr', { id: sanitizedId, qr: dataUrl })
					io.emit('sessions:update', listSessions())
				})
				.catch(() => {
					io.emit('session:qr', { id: sanitizedId, qr: null })
					io.emit('sessions:update', listSessions())
				})
		}
	})

	client.on('ready', () => {
		console.log(`[${sanitizedId}] Client ready!`)
		sessions[sanitizedId].ready = true
		sessions[sanitizedId].qr = null
		sessions[sanitizedId].status = 'ready'
		sessions[sanitizedId].lastActivity = new Date()
		const io = getIO()
		if (io) {
			io.emit('session:ready', { id: sanitizedId })
			io.emit('sessions:update', listSessions())
		}
	})

	client.on('authenticated', () => {
		console.log(`[${sanitizedId}] Authenticated`)
		sessions[sanitizedId].status = 'authenticated'
		sessions[sanitizedId].lastActivity = new Date()
		const io = getIO()
		if (io) io.emit('session:authenticated', { id: sanitizedId })
	})

	client.on('auth_failure', (msg) => {
		console.log(`[${sanitizedId}] Authentication failed: ${msg}`)
		sessions[sanitizedId].status = 'auth_failed'
		sessions[sanitizedId].error = msg
		sessions[sanitizedId].lastActivity = new Date()
		const io = getIO()
		if (io) {
			io.emit('session:error', { id: sanitizedId, error: msg })
			io.emit('sessions:update', listSessions())
		}
	})

	client.on('disconnected', (reason) => {
		console.log(`[${sanitizedId}] Disconnected: ${reason}`)
		sessions[sanitizedId].status = 'disconnected'
		sessions[sanitizedId].ready = false
		sessions[sanitizedId].error = reason
		sessions[sanitizedId].lastActivity = new Date()
		// Don't delete immediately, keep for health check
		setTimeout(() => {
			if (sessions[sanitizedId] && sessions[sanitizedId].status === 'disconnected') {
				delete sessions[sanitizedId]
				const io = getIO()
				if (io) io.emit('sessions:update', listSessions())
			}
		}, 30000) // Keep for 30 seconds for health check
		const io = getIO()
		if (io) io.emit('session:disconnected', { id: sanitizedId, reason })
	})

	client.on('change_state', (state) => {
		console.log(`[${sanitizedId}] State changed: ${state}`)
		sessions[sanitizedId].clientState = state
		sessions[sanitizedId].lastActivity = new Date()
		const io = getIO()
		if (io) io.emit('session:state', { id: sanitizedId, state })
	})

	// Listen for incoming messages to detect replies
	client.on('message', async (message) => {
		try {
			console.log(`[${sanitizedId}] Received message from ${message.from}: ${message.body}`)

			// Check if this message is a reply to another message
			if (message.hasQuotedMsg) {
				const quotedMsg = await message.getQuotedMessage()
				console.log(`[${sanitizedId}] Message is a reply to: ${quotedMsg.body}`)

				// Get contact information
				const contact = await message.getContact()
				const chat = await message.getChat()

				// Prepare webhook data for reply
				const webhookData = {
					sessionId: sanitizedId,
					messageId: message.id._serialized,
					from: message.from,
					to: message.to,
					body: message.body,
					timestamp: message.timestamp,
					isReply: true,
					quotedMessage: {
						id: quotedMsg.id._serialized,
						body: quotedMsg.body,
						from: quotedMsg.from,
						timestamp: quotedMsg.timestamp
					},
					contact: {
						name: contact.name || contact.pushname || contact.number,
						number: contact.number,
						isMyContact: contact.isMyContact
					},
					chat: {
						name: chat.name,
						isGroup: chat.isGroup,
						participantCount: chat.isGroup ? chat.participants.length : null
					}
				}

				// Send webhook notification
				await sendWebhook('message_reply', webhookData)

				// Emit socket event for real-time updates
				const io = getIO()
				if (io) {
					io.emit('message:reply', webhookData)
					// Also emit chat-specific event for real-time UI updates
					io.emit('chat:message', {
						sessionId: sanitizedId,
						chatId: chat.id._serialized,
						message: {
							id: message.id._serialized,
							body: message.body,
							from: message.from,
							to: message.to,
							timestamp: message.timestamp,
							isFromMe: message.fromMe || false,
							isReply: true,
							quotedMessage: {
								id: quotedMsg.id._serialized,
								body: quotedMsg.body,
								from: quotedMsg.from,
								timestamp: quotedMsg.timestamp
							},
							contact: {
								name: contact.name || contact.pushname || contact.number,
								number: contact.number
							}
						}
					})
					// Emit chat list update
					io.emit('chat:update', {
						sessionId: sanitizedId,
						chatId: chat.id._serialized,
						lastMessage: {
							body: message.body,
							timestamp: message.timestamp
						}
					})
				}
			} else {
				// Regular message (not a reply)
				const contact = await message.getContact()
				const chat = await message.getChat()

				const webhookData = {
					sessionId: sanitizedId,
					messageId: message.id._serialized,
					from: message.from,
					to: message.to,
					body: message.body,
					timestamp: message.timestamp,
					isReply: false,
					contact: {
						name: contact.name || contact.pushname || contact.number,
						number: contact.number,
						isMyContact: contact.isMyContact
					},
					chat: {
						name: chat.name,
						isGroup: chat.isGroup,
						participantCount: chat.isGroup ? chat.participants.length : null
					}
				}

				// Send webhook notification for regular messages too (optional)
				await sendWebhook('message_received', webhookData)

				// Emit socket event
				const io = getIO()
				if (io) {
					io.emit('message:received', webhookData)
					// Also emit chat-specific event for real-time UI updates
					io.emit('chat:message', {
						sessionId: sanitizedId,
						chatId: chat.id._serialized,
						message: {
							id: message.id._serialized,
							body: message.body,
							from: message.from,
							to: message.to,
							timestamp: message.timestamp,
							isFromMe: message.fromMe || false,
							contact: {
								name: contact.name || contact.pushname || contact.number,
								number: contact.number
							}
						}
					})
					// Emit chat list update
					io.emit('chat:update', {
						sessionId: sanitizedId,
						chatId: chat.id._serialized,
						lastMessage: {
							body: message.body,
							timestamp: message.timestamp
						}
					})
				}
			}

			// Update session activity
			sessions[sanitizedId].lastActivity = new Date()
		} catch (error) {
			console.error(`[${sanitizedId}] Error processing message:`, error)
		}
	})

	client.initialize().catch(err => {
		console.error(`[${sanitizedId}] Initialization failed`, err)
	})

	return sessions[sanitizedId]
}

function listSessions() {
	return Object.entries(sessions).map(([id, s]) => ({
		id,
		ready: s.ready,
		status: s.status,
		clientState: s.clientState,
		error: s.error,
		createdAt: s.createdAt,
		lastActivity: s.lastActivity,
		uptime: s.createdAt ? Math.floor((new Date() - s.createdAt) / 1000) : 0
	}))
}

function getSession(id) {
	return sessions[id]
}

function getSessionHealth(id) {
	const session = sessions[id]
	if (!session) {
		return { status: 'not_found', healthy: false }
	}

	const now = new Date()
	const timeSinceLastActivity = Math.floor((now - session.lastActivity) / 1000)
	const uptime = Math.floor((now - session.createdAt) / 1000)

	// Consider session unhealthy if no activity for more than 5 minutes
	const isStale = timeSinceLastActivity > 300

	// Check if session is in a good state
	const healthyStates = ['ready', 'authenticated', 'qr_received']
	const isHealthy = healthyStates.includes(session.status) && !isStale

	return {
		id,
		status: session.status,
		clientState: session.clientState,
		ready: session.ready,
		healthy: isHealthy,
		uptime,
		timeSinceLastActivity,
		error: session.error,
		createdAt: session.createdAt,
		lastActivity: session.lastActivity,
		stale: isStale
	}
}

function getAllSessionsHealth() {
	const sessionIds = Object.keys(sessions)
	const totalSessions = sessionIds.length
	const healthData = sessionIds.map(id => getSessionHealth(id))

	const healthySessions = healthData.filter(s => s.healthy).length
	const readySessions = healthData.filter(s => s.ready).length
	const staleSessions = healthData.filter(s => s.stale).length

	return {
		summary: {
			total: totalSessions,
			healthy: healthySessions,
			ready: readySessions,
			stale: staleSessions,
			unhealthy: totalSessions - healthySessions
		},
		sessions: healthData,
		timestamp: new Date(),
		overallHealth: totalSessions > 0 ? (healthySessions / totalSessions) >= 0.8 : true
	}
}

async function deleteSession(id) {
	const s = sessions[id]
	if (s && s.client) {
		try {
			await s.client.destroy()
		} catch (err) {
			console.warn(`[${id}] destroy failed (ignored):`, err?.message || err)
		}
	}
	delete sessions[id]
	await clearRemoteStore(id)
	const io = getIO()
	if (io) io.emit('sessions:update', listSessions())
	return { success: true }
}

// Get all chats for a session
async function getChats(sessionId) {
	const s = getSession(sessionId)
	if (!s) {
		throw new Error('Session not found')
	}
	
	if (!s.ready || !s.client) {
		throw new Error('Session not ready. Please wait for the session to connect.')
	}

	try {
		// Check if client is still connected
		if (!s.client.pupPage || s.client.pupPage.isClosed()) {
			throw new Error('Session closed. Please restart the session.')
		}
		
		const chats = await s.client.getChats()
		// Map chats to a simpler format for the frontend
		const formattedChats = await Promise.all(
			chats.map(async (chat) => {
				const contact = chat.isGroup ? null : await chat.getContact()
				const unreadCount = chat.unreadCount || 0
				const lastMessage = chat.lastMessage
				
				return {
					id: chat.id._serialized,
					name: chat.name,
					isGroup: chat.isGroup,
					isReadOnly: chat.isReadOnly || false,
					unreadCount: unreadCount,
					timestamp: chat.timestamp || 0,
					lastMessage: lastMessage ? {
						id: lastMessage.id._serialized,
						body: lastMessage.body || '',
						from: lastMessage.from,
						timestamp: lastMessage.timestamp,
						isFromMe: lastMessage.fromMe || false
					} : null,
					contact: contact ? {
						name: contact.name || contact.pushname || contact.number,
						number: contact.number,
						isMyContact: contact.isMyContact
					} : null,
					participantCount: chat.isGroup && chat.participants ? chat.participants.length : null
				}
			})
		)

		// Sort by timestamp (most recent first)
		formattedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

		return formattedChats
	} catch (error) {
		console.error(`[${sessionId}] Error getting chats:`, error)
		throw error
	}
}

// Get messages for a specific chat
async function getChatMessages(sessionId, chatId, limit = 50) {
	const s = getSession(sessionId)
	if (!s) {
		throw new Error('Session not found')
	}
	
	if (!s.ready || !s.client) {
		throw new Error('Session not ready. Please wait for the session to connect.')
	}

	try {
		// Check if client is still connected
		if (!s.client.pupPage || s.client.pupPage.isClosed()) {
			throw new Error('Session closed. Please restart the session.')
		}
		
		const chat = await s.client.getChatById(chatId)
		if (!chat) {
			throw new Error('Chat not found')
		}

		// Fetch messages - fetchMessages returns messages from oldest to newest
		// We want the most recent messages, so we fetch more and take the last N
		const fetchLimit = Math.max(limit, 100) // Fetch more to ensure we get latest
		const allMessages = await chat.fetchMessages({ limit: fetchLimit })
		
		console.log(`[${sessionId}] Fetched ${allMessages.length} messages for chat ${chatId}, requesting ${limit}`)
		
		// Get the last N messages (most recent)
		const messages = allMessages.slice(-limit)
		
		console.log(`[${sessionId}] Returning ${messages.length} most recent messages`)

		// Format messages for frontend
		const formattedMessages = await Promise.all(
			messages.map(async (msg) => {
				const contact = msg.fromMe ? null : await msg.getContact()
				const quotedMsg = msg.hasQuotedMsg ? await msg.getQuotedMessage() : null

				// Handle media messages (lazy loading - don't download by default to avoid large payloads)
				// Media will be downloaded on-demand when user views the message
				let mediaData = null
				// Skip media download for now - can be loaded on-demand via separate endpoint
				// This prevents large base64 data from being sent in initial message load

				return {
					id: msg.id._serialized,
					body: msg.body || '',
					type: msg.type,
					from: msg.from,
					to: msg.to,
					timestamp: msg.timestamp,
					isFromMe: msg.fromMe || false,
					hasMedia: msg.hasMedia || false,
					mediaKey: msg.mediaKey,
					mediaData: mediaData,
					location: msg.location,
					vCard: msg.vCard,
					quotedMessage: quotedMsg ? {
						id: quotedMsg.id._serialized,
						body: quotedMsg.body,
						from: quotedMsg.from,
						timestamp: quotedMsg.timestamp,
						fromMe: quotedMsg.fromMe
					} : null,
					contact: contact ? {
						name: contact.name || contact.pushname || contact.number,
						number: contact.number
					} : null
				}
			})
		)

		// Messages are already in chronological order (oldest to newest)
		// Return as-is for proper display
		return formattedMessages
	} catch (error) {
		console.error(`[${sessionId}] Error getting messages for chat ${chatId}:`, error)
		// Provide more helpful error messages
		if (error.message.includes('Session closed') || error.message.includes('Protocol error')) {
			throw new Error('Session closed. Please restart the session.')
		}
		throw error
	}
}

// Download media for a specific message
async function downloadMessageMedia(sessionId, chatId, messageId) {
	const s = getSession(sessionId)
	if (!s) {
		throw new Error('Session not found')
	}
	
	if (!s.ready || !s.client) {
		throw new Error('Session not ready. Please wait for the session to connect.')
	}

	try {
		// Check if client is still connected
		if (!s.client.pupPage || s.client.pupPage.isClosed()) {
			throw new Error('Session closed. Please restart the session.')
		}
		
		const chat = await s.client.getChatById(chatId)
		if (!chat) {
			throw new Error('Chat not found')
		}

		// Get the message
		const messages = await chat.fetchMessages({ limit: 100 })
		const message = messages.find(msg => msg.id._serialized === messageId)
		
		if (!message) {
			throw new Error('Message not found')
		}

		if (!message.hasMedia) {
			throw new Error('Message does not contain media')
		}

		// Download media
		const media = await message.downloadMedia()
		if (!media) {
			throw new Error('Failed to download media')
		}

		return {
			data: media.data, // base64
			mimetype: media.mimetype,
			filename: media.filename || null
		}
	} catch (error) {
		console.error(`[${sessionId}] Error downloading media for message ${messageId}:`, error)
		throw error
	}
}

// Send message to a chat (alternative to existing sendMessage in controllers)
async function sendChatMessage(sessionId, chatId, messageText) {
	const s = getSession(sessionId)
	if (!s || !s.ready || !s.client) {
		throw new Error('Session not ready')
	}

	try {
		const chat = await s.client.getChatById(chatId)
		const result = await chat.sendMessage(messageText)
		
		// Emit socket event for real-time update
		const io = getIO()
		if (io) {
			io.emit('message:sent', {
				sessionId,
				chatId,
				message: {
					id: result.id._serialized,
					body: messageText,
					timestamp: Math.floor(Date.now() / 1000),
					isFromMe: true
				}
			})
		}

		return {
			success: true,
			messageId: result.id._serialized,
			timestamp: Math.floor(Date.now() / 1000)
		}
	} catch (error) {
		console.error(`[${sessionId}] Error sending message to chat ${chatId}:`, error)
		throw error
	}
}

// Restore saved sessions on startup
async function restoreSessions() {
	if (AUTH_STRATEGY === 'remote') {
		console.log('[RESTORE] RemoteAuth enabled; sessions will be loaded from Redis automatically.')
		return
	}

	try {
		const authDir = path.join(process.cwd(), '.wwebjs_auth')
		
		// Check if auth directory exists
		try {
			await fs.access(authDir)
		} catch {
			console.log('[RESTORE] No .wwebjs_auth directory found, skipping session restore')
			return
		}

		// Read all directories in .wwebjs_auth (each directory is a session)
		const entries = await fs.readdir(authDir, { withFileTypes: true })
		const sessionDirs = entries
			.filter(entry => entry.isDirectory())
			.map(entry => entry.name)

		if (sessionDirs.length === 0) {
			console.log('[RESTORE] No saved sessions found')
			return
		}

		console.log(`[RESTORE] Found ${sessionDirs.length} saved session(s): ${sessionDirs.join(', ')}`)

		// Restore each session - avoid duplicates
		for (const clientId of sessionDirs) {
			try {
				// Skip if session already exists in memory (avoid duplicates)
				if (sessions[clientId]) {
					console.log(`[RESTORE] Session ${clientId} already exists in memory, skipping restore`)
					continue
				}

				// Create session using the clientId from the directory name
				// Note: The clientId is already sanitized (whatsapp-web.js creates directories with sanitized names)
				// We'll use it directly as the session ID to ensure consistency
				console.log(`[RESTORE] Restoring session: ${clientId}`)
				await createSession(clientId)
				
				// Add a flag to indicate this was restored (not newly created)
				sessions[clientId].restored = true
			} catch (error) {
				console.error(`[RESTORE] Failed to restore session ${clientId}:`, error.message)
			}
		}

		console.log('[RESTORE] Session restore completed')
	} catch (error) {
		console.error('[RESTORE] Error during session restore:', error.message)
	}
}

// Export session (including auth data and cache)
async function exportSession(sessionId, includeCache = true) {
	try {
		if (AUTH_STRATEGY === 'remote') {
			throw new Error('Export is not supported when using RemoteAuth (sessions live in Redis).')
		}

		const s = getSession(sessionId)
		if (!s) {
			throw new Error('Session not found')
		}

		const sanitizedId = sanitizeClientId(sessionId)
		
		// Try multiple possible paths (Docker volume vs local)
		const possibleAuthPaths = [
			path.join('/usr/src/app/.wwebjs_auth', sanitizedId), // Docker volume path
			path.join(process.cwd(), '.wwebjs_auth', sanitizedId), // Local path
			path.join(process.cwd(), '..', '.wwebjs_auth', sanitizedId) // Alternative local path
		]
		
		const possibleCachePaths = [
			path.join('/usr/src/app/.wwebjs_cache', sanitizedId),
			path.join(process.cwd(), '.wwebjs_cache', sanitizedId),
			path.join(process.cwd(), '..', '.wwebjs_cache', sanitizedId)
		]

		// Find the correct auth directory
		let authDir = null
		let cacheDir = null
		
		for (let i = 0; i < possibleAuthPaths.length; i++) {
			try {
				await fs.access(possibleAuthPaths[i])
				const entries = await fs.readdir(possibleAuthPaths[i])
				// Check if directory has actual files (not just lock files)
				const realFiles = entries.filter(e => !e.startsWith('.') && !e.endsWith('.lock'))
				if (realFiles.length > 0) {
					authDir = possibleAuthPaths[i]
					cacheDir = possibleCachePaths[i]
					break
				}
			} catch (error) {
				// Continue to next path
				continue
			}
		}

		if (!authDir) {
			// Check if session exists in memory but not on disk (newly created, not authenticated yet)
			if (s && s.state === 'QR_CODE' || s.state === 'CONNECTING') {
				throw new Error('Session is not authenticated yet. Please scan the QR code first.')
			}
			throw new Error(`Session auth data not found. Checked paths: ${possibleAuthPaths.join(', ')}. Make sure the session is authenticated.`)
		}

		const exportData = {
			sessionId: sanitizedId,
			originalId: s.originalId || sanitizedId,
			exportedAt: new Date().toISOString(),
			auth: {},
			cache: null
		}

		// Export auth files (including subdirectories)
		async function exportDirectory(dirPath, relativePath = '') {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })
			const result = {}
			
			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name)
				const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
				
				if (entry.isFile()) {
					try {
						const content = await fs.readFile(fullPath, 'utf-8')
						result[relativeFilePath] = content
					} catch (error) {
						console.warn(`[EXPORT] Could not read file ${fullPath}:`, error.message)
					}
				} else if (entry.isDirectory()) {
					// Recursively export subdirectories
					const subDirResult = await exportDirectory(fullPath, relativeFilePath)
					Object.assign(result, subDirResult)
				}
			}
			
			return result
		}
		
		exportData.auth = await exportDirectory(authDir)

		// Export cache if requested (including subdirectories)
		if (includeCache) {
			try {
				await fs.access(cacheDir)
				async function exportDirectory(dirPath, relativePath = '') {
					const entries = await fs.readdir(dirPath, { withFileTypes: true })
					const result = {}
					
					for (const entry of entries) {
						const fullPath = path.join(dirPath, entry.name)
						const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
						
						if (entry.isFile()) {
							try {
								const content = await fs.readFile(fullPath, 'utf-8')
								result[relativeFilePath] = content
							} catch (error) {
								console.warn(`[EXPORT] Could not read cache file ${fullPath}:`, error.message)
							}
						} else if (entry.isDirectory()) {
							const subDirResult = await exportDirectory(fullPath, relativeFilePath)
							Object.assign(result, subDirResult)
						}
					}
					
					return result
				}
				exportData.cache = await exportDirectory(cacheDir)
			} catch {
				// Cache directory doesn't exist, that's fine
				console.log(`[EXPORT] No cache found for session ${sanitizedId}`)
			}
		}

		return exportData
	} catch (error) {
		console.error(`[EXPORT] Error exporting session ${sessionId}:`, error)
		throw error
	}
}

// Import session (including auth data and cache)
async function importSession(exportData, newSessionId = null) {
	try {
		if (AUTH_STRATEGY === 'remote') {
			throw new Error('Import is not supported when using RemoteAuth (sessions live in Redis).')
		}

		if (!exportData || !exportData.auth) {
			throw new Error('Invalid export data')
		}

		const targetSessionId = newSessionId || exportData.originalId || exportData.sessionId
		const sanitizedId = sanitizeClientId(targetSessionId)
		
		// Check if session already exists
		if (sessions[sanitizedId]) {
			throw new Error(`Session ${sanitizedId} already exists`)
		}

		const authDir = path.join(process.cwd(), '.wwebjs_auth', sanitizedId)
		const cacheDir = path.join(process.cwd(), '.wwebjs_cache', sanitizedId)

		// Create auth directory
		await fs.mkdir(authDir, { recursive: true })

		// Import auth files (including subdirectories)
		for (const [relativePath, content] of Object.entries(exportData.auth)) {
			const filePath = path.join(authDir, relativePath)
			// Ensure parent directory exists
			await fs.mkdir(path.dirname(filePath), { recursive: true })
			await fs.writeFile(filePath, content, 'utf-8')
		}

		// Import cache if provided (including subdirectories)
		if (exportData.cache && Object.keys(exportData.cache).length > 0) {
			await fs.mkdir(cacheDir, { recursive: true })
			for (const [relativePath, content] of Object.entries(exportData.cache)) {
				const filePath = path.join(cacheDir, relativePath)
				// Ensure parent directory exists
				await fs.mkdir(path.dirname(filePath), { recursive: true })
				await fs.writeFile(filePath, content, 'utf-8')
			}
		}

		// Create session to restore it (await to ensure it's created)
		await createSession(sanitizedId)
		
		const io = getIO()
		if (io) io.emit('sessions:update', listSessions())

		return {
			success: true,
			sessionId: sanitizedId,
			message: 'Session imported successfully'
		}
	} catch (error) {
		console.error(`[IMPORT] Error importing session:`, error)
		throw error
	}
}

module.exports = { 
	createSession, 
	listSessions, 
	getSession, 
	getSessionHealth, 
	getAllSessionsHealth, 
	deleteSession,
	getChats,
	getChatMessages,
	sendChatMessage,
	downloadMessageMedia,
	restoreSessions,
	exportSession,
	importSession
}
