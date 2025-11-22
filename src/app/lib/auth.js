const TOKEN_KEY = 'waaku_token'
const ROLE_KEY = 'waaku_role'
const USER_KEY = 'waaku_user'

export const setAuth = ({ token, role, user }) => {
	if (token) localStorage.setItem(TOKEN_KEY, token)
	if (role) localStorage.setItem(ROLE_KEY, role)
	if (user) localStorage.setItem(USER_KEY, user)
}

export const clearAuth = () => {
	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(ROLE_KEY)
	localStorage.removeItem(USER_KEY)
}

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const getRole = () => localStorage.getItem(ROLE_KEY) || ''
export const getUser = () => localStorage.getItem(USER_KEY) || ''

export const isAuthenticated = () => Boolean(getToken())
export const isAdmin = () => getRole() === 'admin'
