const jwt = require('../utils/simpleJwt')

const getSecret = () => {
	const secret = (process.env.AUTH_JWT_SECRET || '').trim()
	if (!secret) {
		throw new Error('AUTH_JWT_SECRET is required for JWT authentication')
	}
	return secret
}

const requireAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || ''
		const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
		const token = bearer || req.cookies?.token

		if (!token) {
			return res.status(401).json({ error: 'Missing token' })
		}

		const decoded = jwt.verify(token, getSecret())
		req.user = decoded
		return next()
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' })
	}
}

const requireRole = (role) => (req, res, next) => {
	if (!req.user || req.user.role !== role) {
		return res.status(403).json({ error: 'Forbidden' })
	}
	return next()
}

module.exports = { requireAuth, requireRole }
