<template>
	<div class="flex flex-col h-full bg-gray-50">
		<!-- Chat Header -->
		<div v-if="chat" class="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
			<div class="flex items-center space-x-3 flex-1 min-w-0">
				<button
					v-if="onMobile"
					@click="$emit('back')"
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
					aria-label="Back to chats"
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>
				<div class="flex-shrink-0">
					<div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
						{{ getChatInitials(chat) }}
					</div>
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-base font-semibold text-gray-900 truncate">
						{{ chat.name || chat.contact?.name || 'Unknown' }}
					</h3>
					<p v-if="chat.isGroup" class="text-xs text-gray-500">
						{{ chat.participantCount || 0 }} members
					</p>
					<p v-else-if="chat.contact?.number" class="text-xs text-gray-500 truncate">
						{{ chat.contact.number }}
					</p>
				</div>
			</div>
			<div class="flex items-center space-x-2">
				<button
					@click="refreshMessages"
					:disabled="loadingMessages"
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
					title="Refresh messages"
				>
					<svg
						class="w-5 h-5 text-gray-600"
						:class="{ 'animate-spin': loadingMessages }"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="bg-white border-b border-gray-200 p-8 text-center">
			<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
			</svg>
			<p class="text-gray-500">Select a chat to start messaging</p>
		</div>

		<!-- Messages Area -->
		<div
			ref="messagesContainer"
			class="flex-1 overflow-y-auto p-4 space-y-4"
			:class="{ 'bg-gray-50': chat, 'flex items-center justify-center': !chat }"
		>
			<!-- Loading State -->
			<div v-if="loadingMessages && messages.length === 0" class="text-center">
				<svg class="animate-spin h-8 w-8 text-green-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
				</svg>
				<p class="text-gray-500 text-sm">Loading messages...</p>
			</div>

			<!-- Messages -->
			<div v-else-if="chat && messages.length > 0" class="space-y-4">
				<div
					v-for="(message, index) in messages"
					:key="message.id"
					:class="[
						'flex',
						message.isFromMe ? 'justify-end' : 'justify-start'
					]"
				>
					<div
						:class="[
							'max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm',
							message.isFromMe
								? 'bg-green-500 text-white rounded-tr-none'
								: 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
						]"
					>
						<!-- Quoted Message -->
						<div
							v-if="message.quotedMessage"
							:class="[
								'text-xs mb-2 pb-2 border-l-4 pl-2',
								message.isFromMe ? 'border-white/50' : 'border-green-500/50'
							]"
						>
							<div class="font-semibold opacity-75">
								{{ message.quotedMessage.fromMe ? 'You' : getMessageSender(message.quotedMessage.from) }}
							</div>
							<div class="opacity-75 truncate">{{ message.quotedMessage.body }}</div>
						</div>

						<!-- Message Body -->
						<p class="text-sm whitespace-pre-wrap break-words">{{ message.body || 'Media' }}</p>

						<!-- Message Time -->
						<div
							:class="[
								'text-xs mt-1 flex items-center justify-end space-x-1',
								message.isFromMe ? 'text-white/75' : 'text-gray-500'
							]"
						>
							<span>{{ formatMessageTime(message.timestamp) }}</span>
							<svg
								v-if="message.isFromMe"
								class="w-4 h-4"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			<!-- Empty Messages State -->
			<div v-else-if="chat && !loadingMessages" class="text-center py-8">
				<p class="text-gray-500">No messages yet. Start the conversation!</p>
			</div>
		</div>

		<!-- Message Input -->
		<div v-if="chat" class="bg-white border-t border-gray-200 p-4 sticky bottom-0">
			<form @submit.prevent="sendMessage" class="flex items-end space-x-2">
				<div class="flex-1">
					<textarea
						v-model="messageText"
						@keydown.enter.exact.prevent="sendMessage"
						@keydown.shift.enter="messageText += '\n'"
						placeholder="Type a message..."
						rows="1"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 overflow-y-auto"
						style="min-height: 40px; max-height: 120px;"
					></textarea>
				</div>
				<button
					type="submit"
					:disabled="!messageText.trim() || sending"
					class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
					title="Send message"
				>
					<svg
						v-if="!sending"
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
					</svg>
					<svg
						v-else
						class="animate-spin w-5 h-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
					</svg>
				</button>
			</form>
		</div>
	</div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import api from '../lib/api.js'
import { on as onSocket, off as offSocket } from '../lib/socket.js'

const props = defineProps({
	sessionId: {
		type: String,
		required: true
	},
	chat: {
		type: Object,
		default: null
	},
	onMobile: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['back', 'message-sent'])

const messages = ref([])
const messageText = ref('')
const loadingMessages = ref(false)
const sending = ref(false)
const messagesContainer = ref(null)

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

function getMessageSender(from) {
	// Extract name from contact ID (e.g., "628123456789@c.us" -> "628123456789")
	if (!from) return 'Unknown'
	const match = from.match(/^(\d+)@/)
	return match ? match[1] : from
}

function formatMessageTime(timestamp) {
	if (!timestamp) return ''
	
	const date = new Date(timestamp * 1000)
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	
	// If today, show time only
	if (messageDate.getTime() === today.getTime()) {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
	}
	
	// If yesterday, show "Yesterday"
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	if (messageDate.getTime() === yesterday.getTime()) {
		return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
	}
	
	// If within this week, show day and time
	const weekAgo = new Date(today)
	weekAgo.setDate(weekAgo.getDate() - 7)
	if (messageDate.getTime() > weekAgo.getTime()) {
		return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
	}
	
	// Otherwise, show date and time
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

function scrollToBottom() {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
		}
	})
}

async function loadMessages() {
	if (!props.chat || !props.sessionId) {
		messages.value = []
		return
	}

	loadingMessages.value = true
	try {
		messages.value = await api.getChatMessages(props.sessionId, props.chat.id, 50)
		scrollToBottom()
	} catch (error) {
		console.error('Error loading messages:', error)
		messages.value = []
	} finally {
		loadingMessages.value = false
	}
}

async function refreshMessages() {
	await loadMessages()
}

async function sendMessage() {
	if (!messageText.value.trim() || !props.chat || !props.sessionId || sending.value) return

	const text = messageText.value.trim()
	messageText.value = ''
	sending.value = true

	try {
		const result = await api.sendChatMessage(props.sessionId, props.chat.id, text)
		
		// Add message to local messages array optimistically
		const newMessage = {
			id: result.messageId || `temp-${Date.now()}`,
			body: text,
			timestamp: result.timestamp || Math.floor(Date.now() / 1000),
			isFromMe: true,
			type: 'chat'
		}
		messages.value.push(newMessage)
		scrollToBottom()
		
		emit('message-sent', { chat: props.chat, message: newMessage })
	} catch (error) {
		console.error('Error sending message:', error)
		messageText.value = text // Restore message text on error
		alert('Failed to send message. Please try again.')
	} finally {
		sending.value = false
	}
}

// Socket event handlers
function handleChatMessage(data) {
	if (data.sessionId === props.sessionId && data.chatId === props.chat?.id) {
		// Check if message already exists
		const exists = messages.value.some(msg => msg.id === data.message.id)
		if (!exists) {
			messages.value.push(data.message)
			scrollToBottom()
		}
	}
}

function handleChatUpdate(data) {
	if (data.sessionId === props.sessionId && data.chatId === props.chat?.id) {
		// Refresh messages to get latest
		loadMessages()
	}
}

function handleMessageReceived(data) {
	if (data.sessionId === props.sessionId && data.chatId === props.chat?.id) {
		// Check if message already exists
		const messageId = data.messageId || `msg-${Date.now()}`
		const exists = messages.value.some(msg => msg.id === messageId)
		
		if (!exists) {
			const newMessage = {
				id: messageId,
				body: data.body,
				timestamp: data.timestamp || Math.floor(Date.now() / 1000),
				isFromMe: false,
				type: 'chat',
				from: data.from || data.contact?.number
			}
			messages.value.push(newMessage)
			scrollToBottom()
		}
	}
}

// Watch for chat changes
watch(() => props.chat, (newChat) => {
	if (newChat) {
		loadMessages()
	} else {
		messages.value = []
	}
}, { immediate: true })

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
	refreshMessages,
	loadMessages
})
</script>

