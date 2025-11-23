<template>
	<div class="h-screen flex flex-col bg-[#e5ddd5] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22a%22 patternUnits=%22userSpaceOnUse%22 width=%2260%22 height=%2260%22 patternTransform=%22scale(0.5) rotate(0)%22%3E%3Crect x=%220%22 y=%220%22 width=%2260%22 height=%2260%22 fill=%22hsla(0,0%25,100%25,1)%22/%3E%3Cpath d=%22M30 30h30v30h-30z%22 fill=%22hsla(0,0%25,98%25,1)%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23a)%22/%3E%3C/svg%3E')]">
		<!-- Header -->
		<div class="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10" dir="rtl">
			<div class="flex items-center space-x-3 flex-1 min-w-0">
				<button @click="goBack" class="p-2 hover:bg-[#0a6b5f] rounded-lg transition-colors">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>
				<div class="flex items-center space-x-3 flex-1 min-w-0">
					<div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.62-.01-.248 0-.654.037-.953.371-.298.334-1.037 1.016-1.037 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h2 class="font-semibold text-lg truncate">{{ currentSessionId || 'المحادثات' }}</h2>
						<p class="text-xs text-white/80">جلسات واتساب</p>
					</div>
				</div>
			</div>
			<div class="flex items-center space-x-2">
				<button
					@click="openNewChatModal"
					:disabled="!currentSessionId"
					class="px-3 py-2 bg-white/15 hover:bg-white/20 text-white rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
					title="محادثة جديدة"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
					</svg>
					<span>محادثة جديدة</span>
				</button>
				<button @click="showSessionSwitcher = !showSessionSwitcher" class="p-2 hover:bg-[#0a6b5f] rounded-lg transition-colors" title="Switch Session">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Session Switcher Dropdown -->
		<div v-if="showSessionSwitcher" class="absolute top-16 right-4 bg-white rounded-lg shadow-2xl z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
			<div class="p-2">
				<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">تبديل الجلسة</div>
				<div v-for="session in availableSessions" :key="session.id" 
					@click="switchSession(session.id)"
					:class="[
						'px-3 py-2 rounded-lg cursor-pointer transition-colors',
						currentSessionId === session.id ? 'bg-[#075e54] text-white' : 'hover:bg-gray-100'
					]">
					<div class="flex items-center space-x-3">
						<div :class="[
							'w-8 h-8 rounded-full flex items-center justify-center',
							session.ready ? 'bg-green-500' : 'bg-yellow-500'
						]">
							<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.62-.01-.248 0-.654.037-.953.371-.298.334-1.037 1.016-1.037 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
							</svg>
						</div>
							<div class="flex-1 min-w-0">
								<div class="font-medium truncate">{{ session.id }}</div>
								<div class="text-xs opacity-70">{{ session.ready ? 'جاهزة' : 'جاري الاتصال...' }}</div>
							</div>
						<svg v-if="currentSessionId === session.id" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
						</svg>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Chat Area -->
		<div class="flex-1 flex overflow-hidden">
			<!-- Chat List -->
			<div 
				:class="[
					'bg-white border-r border-gray-200 flex flex-col',
					selectedChat ? 'hidden lg:flex lg:w-1/3 xl:w-1/4' : 'w-full lg:w-1/3 xl:w-1/4'
				]"
			>
			<ChatList
				ref="chatListRef"
				:session-id="currentSessionId"
				:selected-chat-id="selectedChat?.id"
				:on-mobile="isMobile"
				@chat-selected="handleChatSelected"
				@close="goBack"
			/>
			</div>

			<!-- Chat Area -->
			<div
				v-if="selectedChat"
				:class="[
					'flex-1 flex flex-col bg-white',
					isMobile ? 'absolute inset-0 z-10' : ''
				]"
			>
			<ChatArea
				ref="chatAreaRef"
				:session-id="currentSessionId"
				:chat="selectedChat"
				:on-mobile="isMobile"
				@back="handleChatBack"
				@message-sent="handleMessageSent"
			/>
			</div>
		</div>

		<!-- New Chat Modal -->
		<div v-if="newChatModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
			<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-100" dir="rtl">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-xl font-bold text-gray-900">محادثة جديدة</h3>
						<p class="text-sm text-gray-500">أدخل رقم الهاتف والرسالة للإرسال.</p>
					</div>
					<button @click="closeNewChatModal" class="p-2 rounded-lg hover:bg-gray-100">
						<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-semibold text-gray-800 mb-1">رقم الهاتف</label>
						<input
							v-model="newPhone"
							type="text"
							placeholder="مثال: 201234567890"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-800 mb-1">الرسالة</label>
						<textarea
							v-model="newMessage"
							rows="4"
							placeholder="اكتب رسالتك هنا..."
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
						></textarea>
					</div>
					<p v-if="newError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{{ newError }}</p>

					<div class="flex items-center justify-end gap-2">
						<button @click="closeNewChatModal" class="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
							إلغاء
						</button>
						<button
							:disabled="newSending"
							@click="sendNewChat"
							class="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold hover:from-green-600 hover:to-blue-600 transition-colors disabled:opacity-60"
						>
							{{ newSending ? 'جارٍ الإرسال...' : 'إرسال' }}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatList from '../components/ChatList.vue'
import ChatArea from '../components/ChatArea.vue'
import api from '../lib/api.js'
import { connectSocket, on as onSocket, off as offSocket } from '../lib/socket.js'

const route = useRoute()
const router = useRouter()

const currentSessionId = ref(route.params.sessionId || null)
const selectedChat = ref(null)
const showSessionSwitcher = ref(false)
const availableSessions = ref([])
const isMobile = ref(window.innerWidth < 1024)
const chatListRef = ref(null)
const chatAreaRef = ref(null)
const newChatModal = ref(false)
const newPhone = ref('')
const newMessage = ref('')
const newSending = ref(false)
const newError = ref('')

function handleResize() {
	isMobile.value = window.innerWidth < 1024
}

// Socket event handlers are handled by child components (ChatList and ChatArea)
// We don't need to duplicate the refresh logic here
// The child components will handle their own updates via socket events

// Session update handler
function onSessionUpdate(list) {
	availableSessions.value = list
	// If current session is not in list, redirect to dashboard
	if (currentSessionId.value && !list.find(s => s.id === currentSessionId.value)) {
		router.push('/')
	}
}

onMounted(() => {
	window.addEventListener('resize', handleResize)
	fetchSessions()
	connectSocket()
	
	// Only listen to session updates (child components handle chat/message updates)
	onSocket('sessions:update', onSessionUpdate)
})

onUnmounted(() => {
	window.removeEventListener('resize', handleResize)
	offSocket('sessions:update', onSessionUpdate)
})

async function fetchSessions() {
	try {
		availableSessions.value = await api.getSessions()
		// If sessionId from route doesn't exist, use first ready session
		if (!currentSessionId.value || !availableSessions.value.find(s => s.id === currentSessionId.value)) {
			const readySession = availableSessions.value.find(s => s.ready)
			if (readySession) {
				currentSessionId.value = readySession.id
				router.replace(`/chat/${readySession.id}`)
			}
		}
	} catch (err) {
		console.error('Failed to fetch sessions:', err)
	}
}

function switchSession(sessionId) {
	if (sessionId === currentSessionId.value) {
		showSessionSwitcher.value = false
		return
	}
	currentSessionId.value = sessionId
	selectedChat.value = null
	showSessionSwitcher.value = false
	router.replace(`/chat/${sessionId}`)
}

function goBack() {
	router.push('/')
}

function handleChatSelected(chat) {
	selectedChat.value = chat
}

function handleChatBack() {
	selectedChat.value = null
}

function handleMessageSent(data) {
	console.log('Message sent:', data)
}

function openNewChatModal() {
	newChatModal.value = true
	newPhone.value = ''
	newMessage.value = ''
	newError.value = ''
}

function closeNewChatModal() {
	if (newSending.value) return
	newChatModal.value = false
}

async function sendNewChat() {
	newError.value = ''
	if (!currentSessionId.value) {
		newError.value = 'اختر جلسة أولاً'
		return
	}
	const phone = newPhone.value.trim()
	const message = newMessage.value.trim()
	if (!phone || !message) {
		newError.value = 'رقم الهاتف والرسالة مطلوبان'
		return
	}
	newSending.value = true
	try {
		await api.sendMessage(currentSessionId.value, phone, message)
		// جلب المحادثات بعد الإرسال لإظهارها في القائمة
		if (chatListRef.value?.refreshChats) {
			await chatListRef.value.refreshChats()
		}
		newChatModal.value = false
	} catch (err) {
		newError.value = api.getErrorMessage ? api.getErrorMessage(err) : 'تعذر الإرسال'
	} finally {
		newSending.value = false
	}
}

// Export bundle removed
</script>
