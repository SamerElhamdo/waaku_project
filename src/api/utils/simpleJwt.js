const crypto = require('crypto')

const base64url = (input) => Buffer.from(input).toString('base64url')
const fromBase64url = (input) => Buffer.from(input, 'base64url').toString('utf8')

const parseExpiry = (expiresIn) => {
	if (!expiresIn) return null
	if (typeof expiresIn === 'number') return expiresIn
	const match = /^(\d+)([smhd])$/.exec(String(expiresIn))
	if (!match) return null
	const value = Number(match[1])
	const unit = match[2]
	const multipliers = { s: 1, m: 60, h: 3600, d: 86400 }
	return value * multipliers[unit]
}

const sign = (payload, secret, options = {}) => {
	const header = { alg: 'HS256', typ: 'JWT' }
	const expSeconds = parseExpiry(options.expiresIn)
	const now = Math.floor(Date.now() / 1000)
	const body = { ...payload }
	if (expSeconds) {
		body.exp = now + expSeconds
	}

	const headerPart = base64url(JSON.stringify(header))
	const payloadPart = base64url(JSON.stringify(body))
	const data = `${headerPart}.${payloadPart}`
	const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url')
	return `${data}.${signature}`
}

const verify = (token, secret) => {
	if (!token || typeof token !== 'string') throw new Error('Invalid token')
	const parts = token.split('.')
	if (parts.length !== 3) throw new Error('Invalid token')

	const [headerPart, payloadPart, signature] = parts
	const data = `${headerPart}.${payloadPart}`
	const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
		throw new Error('Invalid signature')
	}

	const payload = JSON.parse(fromBase64url(payloadPart))
	if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
		throw new Error('Token expired')
	}
	return payload
}

module.exports = { sign, verify }
