import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ChatView from '../views/ChatView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated, isAdmin } from '../lib/auth'

const routes = [
	{
		path: '/',
		name: 'Dashboard',
		component: Dashboard,
		meta: { requiresAuth: true, requiresAdmin: true }
	},
	{
		path: '/chat/:sessionId?',
		name: 'ChatView',
		component: ChatView,
		props: true
	},
	{
		path: '/login',
		name: 'Login',
		component: LoginView,
		meta: { public: true }
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

router.beforeEach((to, from, next) => {
	if (to.meta.public) return next()

	if (to.meta.requiresAuth && !isAuthenticated()) {
		return next({ name: 'Login', query: { redirect: to.fullPath } })
	}

	if (to.meta.requiresAdmin && !isAdmin()) {
		return next({ name: 'ChatView' })
	}

	if (!to.meta.requiresAuth && !isAuthenticated()) {
		return next({ name: 'Login' })
	}

	return next()
})

export default router
