<template>
	<div class="flex flex-col h-full bg-gray-50 border-r border-gray-200">
		<!-- Chat List Header -->
		<div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
			<div class="flex items-center space-x-3">
				<button
					v-if="onMobile && selectedChatId"
					@click="$emit('close')"
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					aria-label="Back to chats"
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>
				<h2 class="text-lg font-semibold text-gray-900">{{ sessionId }}</h2>
			</div>
			<button
				@click="refreshChats"
				:disabled="loading"
				class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
				title="Refresh chats"
			>
				<svg
					class="w-5 h-5 text-gray-600"
					:class="{ 'animate-spin': loading }"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
			</button>
		</div>

		<!-- Search Bar -->
		<div class="p-3 bg-white border-b border-gray-200">
			<div class="relative">
				<input
					v-model="searchQuery"
					type="text"
					placeholder="Search chats..."
					class="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
				/>
				<svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading && chats.length === 0" class="flex-1 flex items-center justify-center">
			<div class="text-center">
				<svg class="animate-spin h-8 w-8 text-green-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
				</svg>
				<p class="text-gray-500 text-sm">Loading chats...</p>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else-if="!loading && filteredChats.length === 0" class="flex-1 flex items-center justify-center p-4">
			<div class="text-center">
				<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
				</svg>
				<p class="text-gray-500 text-sm">
					{{ searchQuery ? 'No chats found' : 'No chats available' }}
				</p>
			</div>
		</div>

		<!-- Chat List -->
		<div v-else class="flex-1 overflow-y-auto">
			<div class="divide-y divide-gray-200">
				<button
					v-for="chat in filteredChats"
					:key="chat.id"
					@click="selectChat(chat)"
					:class="[
						'w-full p-4 text-left hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100',
						selectedChatId === chat.id ? 'bg-green-50 border-l-4 border-green-500' : ''
					]"
				>
					<div class="flex items-start space-x-3">
						<!-- Avatar -->
						<div class="flex-shrink-0 relative">
							<div class="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
								{{ getChatInitials(chat) }}
							</div>
							<div v-if="chat.unreadCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
								{{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
							</div>
						</div>

						<!-- Chat Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-1">
								<h3 class="text-sm font-semibold text-gray-900 truncate">
									{{ chat.name || chat.contact?.name || 'Unknown' }}
								</h3>
								<span v-if="chat.lastMessage || chat.timestamp" class="text-xs text-gray-500 flex-shrink-0 ml-2">
									{{ formatTime(chat.lastMessage?.timestamp || chat.timestamp) }}
								</span>
							</div>
							<div class="flex items-center space-x-2">
								<p v-if="chat.lastMessage" class="text-sm text-gray-600 truncate flex-1">
									<span v-if="chat.lastMessage.isFromMe" class="text-gray-500">You: </span>
									{{ chat.lastMessage.body || 'Media' }}
								</p>
								<span v-else class="text-sm text-gray-400">No messages</span>
							</div>
							<div v-if="chat.isGroup" class="mt-1 flex items-center space-x-1">
								<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
								</svg>
								<span class="text-xs text-gray-500">{{ chat.participantCount || 0 }} members</span>
							</div>
						</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from '../lib/api.js'
import { on as onSocket, off as offSocket } from '../lib/socket.js'

const props = defineProps({
	sessionId: {
		type: String,
		required: true
	},
	selectedChatId: {
		type: String,
		default: null
	},
	onMobile: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['chat-selected', 'close'])

const chats = ref([])
const loading = ref(false)
const searchQuery = ref('')

const filteredChats = computed(() => {
	if (!searchQuery.value) return chats.value
	
	const query = searchQuery.value.toLowerCase()
	return chats.value.filter(chat => {
		const name = (chat.name || chat.contact?.name || '').toLowerCase()
		const lastMessage = (chat.lastMessage?.body || '').toLowerCase()
		return name.includes(query) || lastMessage.includes(query)
	})
})

function getChatInitials(chat) {
	const name = chat.name || chat.contact?.name || '?'
	if (chat.isGroup) {
		return 'G'
	}
	const parts = name.split(' ')
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase()
	}
	return name.charAt(0).toUpperCase()
}

function formatTime(timestamp) {
	if (!timestamp) return ''
	
	const date = new Date(timestamp * 1000)
	const now = new Date()
	const diff = now - date
	
	// If within last 24 hours, show time
	if (diff < 24 * 60 * 60 * 1000) {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
	}
	
	// If within last week, show day
	if (diff < 7 * 24 * 60 * 60 * 1000) {
		return date.toLocaleDateString('en-US', { weekday: 'short' })
	}
	
	// Otherwise, show date
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function selectChat(chat) {
	emit('chat-selected', chat)
}

async function loadChats() {
	if (!props.sessionId) return
	
	loading.value = true
	try {
		chats.value = await api.getChats(props.sessionId)
	} catch (error) {
		console.error('Error loading chats:', error)
		chats.value = []
	} finally {
		loading.value = false
	}
}

async function refreshChats() {
	await loadChats()
}

// Debounce timer for refresh
let refreshTimer = null

// Socket event handlers for real-time updates
function handleChatMessage(data) {
	if (data.sessionId === props.sessionId) {
		// Update the chat in the list with new message info
		const chatIndex = chats.value.findIndex(c => c.id === data.chatId)
		if (chatIndex !== -1) {
			// Update last message and timestamp
			chats.value[chatIndex].lastMessage = data.message
			chats.value[chatIndex].timestamp = data.message.timestamp
			
			// If message is not from me, increment unread count (if not selected)
			if (!data.message.isFromMe && chats.value[chatIndex].id !== props.selectedChatId) {
				chats.value[chatIndex].unreadCount = (chats.value[chatIndex].unreadCount || 0) + 1
			}
			
			// Move chat to top (most recent first)
			const updatedChat = chats.value.splice(chatIndex, 1)[0]
			chats.value.unshift(updatedChat)
		} else {
			// New chat, refresh the list (debounced)
			if (refreshTimer) {
				clearTimeout(refreshTimer)
			}
			refreshTimer = setTimeout(() => {
				loadChats()
			}, 500)
		}
	}
}

function handleChatUpdate(data) {
	if (data.sessionId === props.sessionId) {
		// Debounce refresh to avoid too many calls
		if (refreshTimer) {
			clearTimeout(refreshTimer)
		}
		refreshTimer = setTimeout(() => {
			loadChats()
		}, 300)
	}
}

function handleMessageReceived(data) {
	if (data.sessionId === props.sessionId && data.chatId) {
		// Update chat with new message
		const chatIndex = chats.value.findIndex(c => c.id === data.chatId)
		if (chatIndex !== -1) {
			chats.value[chatIndex].lastMessage = {
				body: data.body,
				timestamp: data.timestamp || Math.floor(Date.now() / 1000),
				isFromMe: false
			}
			chats.value[chatIndex].timestamp = data.timestamp || Math.floor(Date.now() / 1000)
			
			// Increment unread count if chat is not selected
			if (chats.value[chatIndex].id !== props.selectedChatId) {
				chats.value[chatIndex].unreadCount = (chats.value[chatIndex].unreadCount || 0) + 1
			}
			
			// Move to top
			const updatedChat = chats.value.splice(chatIndex, 1)[0]
			chats.value.unshift(updatedChat)
		} else {
			// New chat, refresh (debounced)
			if (refreshTimer) {
				clearTimeout(refreshTimer)
			}
			refreshTimer = setTimeout(() => {
				loadChats()
			}, 500)
		}
	}
}

// Watch for session ID changes
watch(() => props.sessionId, (newId) => {
	if (newId) {
		loadChats()
	}
}, { immediate: true })

// Watch for selected chat changes to reset unread count
watch(() => props.selectedChatId, (newSelectedId) => {
	if (newSelectedId) {
		const chat = chats.value.find(c => c.id === newSelectedId)
		if (chat) {
			chat.unreadCount = 0
		}
	}
})

// Setup socket listeners
onMounted(() => {
	onSocket('chat:message', handleChatMessage)
	onSocket('chat:update', handleChatUpdate)
	onSocket('message:received', handleMessageReceived)
})

onUnmounted(() => {
	offSocket('chat:message', handleChatMessage)
	offSocket('chat:update', handleChatUpdate)
	offSocket('message:received', handleMessageReceived)
})

// Expose refresh function
defineExpose({
	refreshChats,
	loadChats
})
</script>

