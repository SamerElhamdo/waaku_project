import http from './http.js'

/**
 * WhatsApp Multi-Session API Service
 * Contains all API calls organized by functionality
 */

// ===== SESSIONS API =====

/**
 * Get all sessions
 * @returns {Promise} Array of sessions
 */
export const getSessions = async () => {
	const response = await http.get('/api/sessions')
	return response.data
}

/**
 * Get sessions health summary
 * @returns {Promise} Health data with summary
 */
export const getSessionsHealth = async () => {
	const response = await http.get('/api/sessions/health')
	return response.data
}

/**
 * Create a new session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise} Created session data
 */
export const createSession = async (sessionId) => {
	const response = await http.post('/api/sessions', {
		id: sessionId
	})
	return response.data
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID to delete
 * @returns {Promise} Deletion result
 */
export const deleteSession = async (sessionId) => {
	const response = await http.delete(`/api/sessions/${sessionId}`)
	return response.data
}

/**
 * Restart a session
 * @param {string} sessionId - Session ID to restart
 * @returns {Promise} Restart result
 */
export const restartSession = async (sessionId) => {
	const response = await http.post(`/api/sessions/${sessionId}/restart`)
	return response.data
}

/**
 * Check session health
 * @param {string} sessionId - Session ID to check
 * @returns {Promise} Session health status
 */
export const getSessionHealth = async (sessionId) => {
	const response = await http.get(`/api/sessions/${sessionId}/health`)
	return response.data
}

// ===== QR CODE API =====

/**
 * Generate QR code for session
 * @param {string} sessionId - Session ID
 * @returns {Promise} QR code data
 */
export const generateQRCode = async (sessionId) => {
	const response = await http.get(`/api/sessions/${sessionId}/qr`)
	return response.data
}

// ===== MESSAGING API =====

/**
 * Validate phone number
 * @param {string} sessionId - Session ID
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Promise} Validation result
 */
export const validatePhoneNumber = async (sessionId, phoneNumber) => {
	const response = await http.post(`/api/messages/${sessionId}/validate`, {
		to: phoneNumber
	})
	return response.data
}

/**
 * Send message via WhatsApp
 * @param {string} sessionId - Session ID
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message text
 * @returns {Promise} Send result
 */
export const sendMessage = async (sessionId, phoneNumber, message) => {
	const response = await http.post(`/api/messages/${sessionId}/send`, {
		to: phoneNumber,
		message: message
	})
	return response.data
}

// ===== SESSION EXPORT/IMPORT API =====

/**
 * Export a session (with optional cache)
 * @param {string} sessionId - Session ID to export
 * @param {boolean} includeCache - Whether to include cache (default: true)
 * @returns {Promise} Export data
 */
export const exportSession = async (sessionId, includeCache = true) => {
	const response = await http.get(`/api/sessions/${sessionId}/export`, {
		params: { cache: includeCache }
	})
	return response.data
}

/**
 * Import a session
 * @param {Object} exportData - Exported session data
 * @param {string} newSessionId - Optional new session ID
 * @returns {Promise} Import result
 */
export const importSession = async (exportData, newSessionId = null) => {
	const response = await http.post('/api/sessions/import', {
		...exportData,
		newSessionId
	})
	return response.data
}

// ===== CHAT API =====

/**
 * Get all chats for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise} Array of chats
 */
export const getChats = async (sessionId) => {
	const response = await http.get(`/api/messages/${sessionId}/chats`)
	return response.data
}

/**
 * Get messages for a specific chat
 * @param {string} sessionId - Session ID
 * @param {string} chatId - Chat ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise} Array of messages
 */
export const getChatMessages = async (sessionId, chatId, limit = 50) => {
	const response = await http.get(`/api/messages/${sessionId}/chats/${chatId}/messages`, {
		params: { limit }
	})
	return response.data
}

/**
 * Send message to a specific chat
 * @param {string} sessionId - Session ID
 * @param {string} chatId - Chat ID
 * @param {string} message - Message text
 * @returns {Promise} Send result
 */
export const sendChatMessage = async (sessionId, chatId, message) => {
	const response = await http.post(`/api/messages/${sessionId}/chats/${chatId}/send`, {
		message: message
	})
	return response.data
}

// ===== AUTH (UI) =====

/**
 * Login to UI (sets httpOnly cookie)
 * @param {string} username
 * @param {string} password
 */
export const login = async (username, password) => {
	const response = await http.post('/auth/login', { username, password })
	return response.data
}

/**
 * Logout from UI (clears cookie)
 */
export const logout = async () => {
	const response = await http.post('/auth/logout')
	return response.data
}

/**
 * Check current UI auth state
 */
export const me = async () => {
	const response = await http.get('/auth/me')
	return response.data
}

// ===== BATCH OPERATIONS =====

/**
 * Get sessions and health data together
 * @returns {Promise} Object with sessions and health data
 */
export const getSessionsWithHealth = async () => {
	try {
		const [sessions, health] = await Promise.all([
			getSessions(),
			getSessionsHealth()
		])
		return { sessions, health }
	} catch (error) {
		console.error('Error fetching sessions with health:', error)
		throw error
	}
}

// ===== ERROR HELPERS =====

/**
 * Extract error message from API response
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
	if (error.response?.data?.error) {
		return error.response.data.error
	}
	if (error.response?.data?.message) {
		return error.response.data.message
	}
	if (error.message) {
		return error.message
	}
	return 'An unexpected error occurred'
}

/**
 * Check if error is network related
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
	return !error.response && error.request
}

/**
 * Check if error is server error (5xx)
 * @param {Error} error - Error object
 * @returns {boolean} True if server error
 */
export const isServerError = (error) => {
	return error.response && error.response.status >= 500
}

// Export all as default object for convenience
export default {
	// Sessions
	getSessions,
	getSessionsHealth,
	createSession,
	deleteSession,
	restartSession,
	getSessionHealth,
	exportSession,
	importSession,

	// QR Code
	generateQRCode,

	// Messaging
	validatePhoneNumber,
	sendMessage,

	// Chat
	getChats,
	getChatMessages,
	sendChatMessage,

	// Auth
	login,
	logout,
	me,

	// Batch
	getSessionsWithHealth,

	// Error helpers
	getErrorMessage,
	isNetworkError,
	isServerError
}
