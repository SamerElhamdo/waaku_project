import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ChatView from '../views/ChatView.vue'

const routes = [
	{
		path: '/',
		name: 'Dashboard',
		component: Dashboard
	},
	{
		path: '/chat/:sessionId?',
		name: 'ChatView',
		component: ChatView,
		props: true
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

export default router

