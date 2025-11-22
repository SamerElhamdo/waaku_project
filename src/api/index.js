require('dotenv').config()
const express = require('express')
const http = require('http')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const helmet = require('helmet')
const compression = require('compression')
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./swagger')
const sessionRoutes = require('./routes/session')
const messageRoutes = require('./routes/messages')
const { validateApiKey, logApiAccess, rateLimiter, generateApiKey } = require('./middleware/auth')
const { initSocketIO } = require('./socket')
const { restoreSessions } = require('./whatsapp/session')

const app = express()
const server = http.createServer(app)

// Security and performance middleware
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// Trust proxy (needed when running behind nginx to ensure secure cookies behave correctly)
// Set TRUST_PROXY to the number of hops (default 1 when behind a single reverse proxy)
const TRUST_PROXY = process.env.TRUST_PROXY
if (TRUST_PROXY) {
  app.set('trust proxy', Number.isNaN(Number(TRUST_PROXY)) ? true : Number(TRUST_PROXY))
}

// Configurable CORS (comma-separated origins in CORS_ORIGINS), defaults to allow all
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : '*'
const corsOptions = corsOrigins === '*' ? {} : { origin: corsOrigins, credentials: true }
app.use(cors(corsOptions))

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(compression())

// Security middleware
app.use(logApiAccess)
app.use(rateLimiter)

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
	explorer: true,
	customCss: '.swagger-ui .topbar { display: none }',
	customSiteTitle: 'WhatsApp Multi-Session API Documentation',
	swaggerOptions: {
		persistAuthorization: true,
		displayRequestDuration: true,
		docExpansion: 'list',
		filter: true,
	}
}))

// General health endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		service: 'WhatsApp Multi-Session Manager',
		timestamp: new Date(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		version: process.env.npm_package_version || '1.0.0',
		security: {
			apiKeyFormat: 'UUID4 + SHA-512',
			rateLimiting: 'Active',
			authentication: 'Required'
		}
	})
})

// Redirect root to API documentation
app.get('/api', (req, res) => {
	res.redirect('/api-docs')
})

// UI auth removed - app now loads directly without login

// credentialsValid function removed - no longer needed

// Auth endpoints removed - no longer needed

// API routes (protected by API key)
app.use('/api', validateApiKey)
app.use('/api/sessions', sessionRoutes)
app.use('/api/messages', messageRoutes)

// Serve built frontend (Vite dist) in production
const frontendDir = path.resolve(__dirname, '../../dist')
app.use(express.static(frontendDir, { maxAge: '1h', index: false }))

// SPA fallback: send index.html for non-API routes
// Exclude socket.io, api-docs, and health endpoints
app.get(/^\/(?!api|api-docs|health|socket\.io).*/, (req, res) => {
	res.sendFile(path.join(frontendDir, 'index.html'))
})

// Initialize Socket.IO and export via socket singleton
const io = initSocketIO(server)
module.exports.io = io

const port = Number(process.env.PORT || process.env.VITE_API_DEV_PORT || 4300)

// Host configuration: if ON_HOST=true, listen on 0.0.0.0 (accessible from network)
// Otherwise, listen on localhost (127.0.0.1) for local access only
const onHost = process.env.ON_HOST === 'true'
const host = onHost ? '0.0.0.0' : 'localhost'

// Restore saved sessions on startup (disabled by default - use export/import instead)
// Set AUTO_RESTORE_SESSIONS=true to enable automatic restore
const autoRestore = process.env.AUTO_RESTORE_SESSIONS === 'true'
if (autoRestore) {
	console.log('[STARTUP] Auto-restore enabled. Restoring saved sessions...')
	restoreSessions().then(() => {
		server.listen(port, host, () => {
			const hostDisplay = onHost ? `0.0.0.0:${port} (accessible from network)` : `localhost:${port} (local only)`
			console.log(`Server running at http://${hostDisplay}`)
			const { listSessions } = require('./whatsapp/session')
			const sessions = listSessions()
			if (sessions.length > 0) {
				console.log(`[STARTUP] ${sessions.length} session(s) restored and initializing...`)
			}
		})
	}).catch((error) => {
		console.error('[STARTUP] Error restoring sessions:', error)
		server.listen(port, host, () => {
			const hostDisplay = onHost ? `0.0.0.0:${port} (accessible from network)` : `localhost:${port} (local only)`
			console.log(`Server running at http://${hostDisplay}`)
		})
	})
} else {
	console.log('[STARTUP] Auto-restore disabled. Use export/import to manage sessions.')
	server.listen(port, host, () => {
		const hostDisplay = onHost ? `0.0.0.0:${port} (accessible from network)` : `localhost:${port} (local only)`
		console.log(`Server running at http://${hostDisplay}`)
	})
}

server.on('error', (err) => {
	if (err && err.code === 'EADDRINUSE') {
		console.error(`\nPort ${port} is already in use.`)
		console.error('Tips:')
		console.error('- Stop the process using that port, or')
		console.error('- Run: PORT=4301 VITE_API_DEV_PORT=4301 npm run dev (or use "npm run dev:4301")')
	}
})
