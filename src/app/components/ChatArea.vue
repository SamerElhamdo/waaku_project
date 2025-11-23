<template>
	<div class="flex flex-col h-full bg-gray-50">
		<!-- Chat Header -->
		<div v-if="chat" class="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10" dir="rtl">
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
						{{ chat.name || chat.contact?.name || 'غير معروف' }}
					</h3>
					<p v-if="chat.isGroup" class="text-xs text-gray-500">
						{{ chat.participantCount || 0 }} عضو
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
					title="تحديث الرسائل"
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
				<button
					v-if="chat?.contact?.number || chat?.name"
					@click="openContactModal"
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					title="حفظ جهة الاتصال"
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="bg-white border-b border-gray-200 p-8 text-center">
			<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
			</svg>
			<p class="text-gray-500" dir="rtl">اختر محادثة لبدء المراسلة</p>
		</div>

		<!-- Chat Meta / Actions -->
		<div v-if="chat" class="bg-gradient-to-r from-green-50 via-white to-blue-50 border-b border-gray-200 px-4 py-3 flex flex-col gap-2" dir="rtl">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex flex-wrap items-center gap-2">
					<span class="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-full text-xs font-semibold">
						{{ messages.length }} رسالة
					</span>
					<span class="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-semibold">
						{{ mediaCount }} ميديا
					</span>
					<span class="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs">
						آخر تحديث: {{ lastUpdatedText }}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<button
						@click="refreshMessages"
						:disabled="loadingMessages"
						class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
					>
						<span v-if="loadingMessages" class="flex items-center gap-2">
							<svg class="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							جاري التحديث...
						</span>
						<span v-else class="flex items-center gap-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
							</svg>
							تحديث
						</span>
					</button>
					<button
						@click="exportChatHistory"
						:disabled="exportingChat"
						class="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-60"
					>
						<span v-if="exportingChat" class="flex items-center gap-2">
							<svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							جاري التصدير...
						</span>
						<span v-else class="flex items-center gap-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
							</svg>
							تصدير المحادثة
						</span>
					</button>
					<button
						@click="scrollToBottom"
						class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
					>
						<span class="flex items-center gap-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7-7-7m14-5l-7 7-7-7"/>
							</svg>
							Latest
						</span>
					</button>
				</div>
			</div>
			<div v-if="loadError" class="flex items-center justify-between bg-white border border-red-200 text-red-700 rounded-lg px-3 py-2">
				<span class="text-sm">{{ loadError }}</span>
				<button @click="refreshMessages" class="text-sm font-semibold underline">Retry</button>
			</div>
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
				<p class="text-gray-500 text-sm" dir="rtl">جاري تحميل الرسائل...</p>
			</div>

			<!-- Messages -->
			<div v-else-if="chat && messages.length > 0" class="space-y-4">
				<div
					v-for="(message, index) in messages"
					:key="message.id"
					:ref="el => setMessageRef(el, message)"
					:class="[
						'flex',
						message.isFromMe ? 'justify-end' : 'justify-start'
					]"
				>
					<div
						:class="[
							'max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg shadow-sm relative',
							message.isFromMe
								? 'bg-green-500 text-white rounded-tr-none'
								: 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
						]"
					>
						<button
							class="absolute top-2 right-2 text-xs"
							:class="message.isFromMe ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'"
							@click.stop="toggleActionMenu(message.id)"
							title="خيارات"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm4 2a2 2 0 100-4 2 2 0 000 4z" />
							</svg>
						</button>
						<div
							v-if="actionMenuId === message.id"
							class="absolute z-10 top-8 right-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-lg py-1 text-sm w-32"
						>
							<button
								class="w-full text-right px-3 py-1 hover:bg-gray-100"
								@click.stop="copyMessage(message); closeActionMenu()"
							>نسخ</button>
							<button
								class="w-full text-right px-3 py-1 hover:bg-gray-100"
								@click.stop="forwardMessage(message)"
							>تحويل</button>
						</div>

						<!-- Quoted Message -->
						<div
							v-if="message.quotedMessage"
							:class="[
								'text-xs mb-2 pb-2 border-l-4 pl-2',
								message.isFromMe ? 'border-white/50' : 'border-green-500/50'
							]"
						>
							<div class="font-semibold opacity-75">
								{{ message.quotedMessage.fromMe ? 'أنت' : getMessageSender(message.quotedMessage.from) }}
							</div>
							<div class="opacity-75 truncate">{{ message.quotedMessage.body }}</div>
						</div>

						<!-- Message Body -->
						<!-- Media Display -->
						<div v-if="message.hasMedia" class="mb-2">
							<!-- Loading State -->
							<div v-if="!message.mediaData && message.loadingMedia" class="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
								<svg class="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="ml-2 text-sm text-gray-600" dir="rtl">جاري تحميل الوسائط...</span>
							</div>
							<!-- Media Content -->
							<div v-else-if="message.mediaData">
								<!-- Image -->
								<img 
									v-if="message.mediaData.mimetype?.startsWith('image/')"
									:src="`data:${message.mediaData.mimetype};base64,${message.mediaData.data}`"
									:alt="message.mediaData.filename || 'صورة'"
									class="max-w-full rounded-lg cursor-pointer"
									@click="openMediaViewer(message.mediaData)"
								/>
								<!-- Video -->
								<video 
									v-else-if="message.mediaData.mimetype?.startsWith('video/')"
									:src="`data:${message.mediaData.mimetype};base64,${message.mediaData.data}`"
									controls
									class="max-w-full rounded-lg"
								/>
								<!-- Audio -->
								<div
									v-else-if="message.mediaData.mimetype?.startsWith('audio/')"
									class="w-full flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2"
								>
									<audio
										:ref="el => registerAudioRef(el, message.id)"
										:src="`data:${message.mediaData.mimetype};base64,${message.mediaData.data}`"
										class="hidden"
										@timeupdate="updateAudioProgress(message.id)"
										@loadedmetadata="updateAudioProgress(message.id)"
										@ended="onAudioEnded(message.id)"
									/>
									<button
										@click="toggleAudio(message.id)"
										class="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center border border-gray-200"
									>
										<svg v-if="audioStates[message.id]?.playing" class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"/>
										</svg>
										<svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.03v5.94a1 1 0 001.555.832l5.197-3.03a1 1 0 000-1.664z"/>
										</svg>
									</button>
									<div class="flex-1">
										<div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
											<div
												class="h-full bg-green-500"
												:style="{ width: audioProgressPercent(message.id) + '%' }"
											></div>
										</div>
										<div class="flex justify-between text-xs text-gray-600 mt-1">
											<span>{{ formatAudioTime(audioStates[message.id]?.current || 0) }}</span>
											<span>{{ formatAudioTime(audioStates[message.id]?.duration || 0) }}</span>
										</div>
									</div>
								</div>
								<!-- Other files -->
								<div v-else class="flex items-center space-x-2 p-2 bg-gray-100 rounded">
									<svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
									</svg>
									<div class="flex-1">
										<p class="text-xs font-medium">{{ message.mediaData.filename || 'ملف' }}</p>
										<p class="text-xs text-gray-500">{{ message.mediaData.mimetype || 'نوع غير معروف' }}</p>
									</div>
									<a 
									:href="`data:${message.mediaData.mimetype};base64,${message.mediaData.data}`"
									:download="message.mediaData.filename || 'file'"
										class="p-2 hover:bg-gray-200 rounded"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
										</svg>
									</a>
								</div>
							</div>
							<!-- Load Media Button -->
							<button
								v-else
								@click="loadMediaForMessage(message)"
								class="flex items-center justify-center space-x-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full"
							>
								<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
								</svg>
								<span class="text-sm text-gray-700" dir="rtl">تحميل الوسائط</span>
							</button>
						</div>
						<!-- Text Message + actions -->
						<div v-if="message.body" class="flex items-start gap-2">
							<p class="text-sm whitespace-pre-wrap break-words flex-1">{{ message.body }}</p>
							<button
								@click="copyMessage(message)"
								class="text-xs text-white/80 hover:text-white transition-colors"
								:class="message.isFromMe ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
								title="نسخ الرسالة"
							>
								<svg v-if="copiedMessageId === message.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
								</svg>
								<svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-8 4h6m2 4H8a2 2 0 01-2-2V7a2 2 0 012-2h8l4 4v10a2 2 0 01-2 2z"/>
								</svg>
							</button>
						</div>

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
				<p class="text-gray-500" dir="rtl">لا توجد رسائل بعد. ابدأ المحادثة!</p>
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
						placeholder="اكتب رسالة..."
						rows="1"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 overflow-y-auto"
						style="min-height: 40px; max-height: 120px;"
					></textarea>
				</div>
				<button
					type="submit"
					:disabled="!messageText.trim() || sending"
					class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
					title="إرسال الرسالة"
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

		<!-- Media Viewer Modal -->
		<div 
			v-if="mediaViewer.visible"
			@click="closeMediaViewer"
			class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
		>
			<button 
				@click="closeMediaViewer"
				class="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
			</button>
			<img 
				v-if="mediaViewer.type === 'image'"
				:src="mediaViewer.src"
				alt="Media viewer"
				class="max-w-full max-h-full object-contain"
				@click.stop
			/>
		</div>

		<!-- Forward Modal -->
		<div
			v-if="forwardModal"
			class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
		>
			<div class="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4" dir="rtl">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">تحويل الرسالة</h3>
					<button @click="forwardModal = false" class="text-gray-500 hover:text-gray-700">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>

				<p class="text-sm text-gray-600">
					اختر جهات الاتصال أو المحادثات المراد التحويل إليها (يمكن اختيار أكثر من جهة).
				</p>

				<div class="space-y-2">
					<input
						v-model="forwardSearch"
						type="text"
						placeholder="بحث بالاسم أو الرقم..."
						class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
					<div class="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
					<button
						v-for="chatItem in filteredForwardChats"
						:key="chatItem.id"
						type="button"
						@click="toggleForwardTarget(chatItem.id)"
						class="w-full flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
						:class="forwardTargets.includes(chatItem.id) ? 'border-green-400 bg-green-50' : 'border-gray-200'"
					>
						<div class="flex flex-col text-right">
							<span class="text-sm font-semibold text-gray-800">{{ chatItem.name || chatItem.contact?.name || 'بدون اسم' }}</span>
							<span class="text-xs text-gray-500">{{ chatItem.contact?.number || chatItem.id }}</span>
						</div>
						<span v-if="forwardTargets.includes(chatItem.id)" class="text-green-600 text-xs font-semibold">محدد</span>
					</button>

					<div v-if="forwardLoading" class="text-center text-gray-500 text-sm py-4">
						جاري تحميل المحادثات...
					</div>
					<div v-else-if="!filteredForwardChats.length" class="text-center text-gray-500 text-sm py-4">
						لا توجد محادثات متاحة
					</div>
				</div>

				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button
						@click="forwardModal = false"
						class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
					>
						إلغاء
					</button>
					<button
						@click="confirmForward"
						:disabled="!forwardTargets.length || forwardSending"
						class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
					>
						<span v-if="forwardSending" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full align-middle mr-2"></span>
						تحويل ({{ forwardTargets.length }})
					</button>
				</div>
			</div>
		</div>

		<!-- Contact Modal -->
		<div
			v-if="contactModal"
			class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
		>
			<div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4" dir="rtl">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">حفظ جهة الاتصال</h3>
					<button @click="contactModal = false" class="text-gray-500 hover:text-gray-700">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>

				<div class="space-y-3">
					<div>
						<label class="block text-sm text-gray-600 mb-1">رقم الهاتف</label>
						<input
							v-model="contactPhone"
							type="text"
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
							placeholder="مثال: 9665xxxxxxx"
						/>
					</div>
					<div class="flex gap-3">
						<div class="flex-1">
							<label class="block text-sm text-gray-600 mb-1">الاسم الأول</label>
							<input
								v-model="contactFirstName"
								type="text"
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="الاسم الأول"
							/>
						</div>
						<div class="flex-1">
							<label class="block text-sm text-gray-600 mb-1">الاسم الأخير (اختياري)</label>
							<input
								v-model="contactLastName"
								type="text"
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="الاسم الأخير"
							/>
						</div>
					</div>

					<div v-if="contactError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
						{{ contactError }}
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button
						@click="contactModal = false"
						class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
					>
						إلغاء
					</button>
					<button
						@click="unblockContactHandler"
						:disabled="contactUnblocking || contactSaving || contactBlocking"
						class="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-60"
					>
						<span v-if="contactUnblocking" class="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full align-middle"></span>
						<span v-else>فك الحظر</span>
					</button>
					<button
						@click="blockContactHandler"
						:disabled="contactBlocking || contactSaving || contactUnblocking"
						class="px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
					>
						<span v-if="contactBlocking" class="animate-spin inline-block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full align-middle"></span>
						<span v-else>حظر</span>
					</button>
					<button
						@click="saveContactHandler"
						:disabled="contactSaving || contactBlocking || contactUnblocking"
						class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
					>
						<span v-if="contactSaving" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full align-middle"></span>
						<span v-else>حفظ</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
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
	},
	availableChats: {
		type: Array,
		default: () => []
	}
})

const emit = defineEmits(['back', 'message-sent'])

const messages = ref([])
const messageText = ref('')
const loadingMessages = ref(false)
const sending = ref(false)
const messagesContainer = ref(null)
const mediaViewer = ref({ visible: false, src: '', type: '' })
const mediaObserver = ref(null)
const loadError = ref('')
const exportingChat = ref(false)
const audioRefs = ref({})
const audioStates = ref({})
const contactModal = ref(false)
const contactFirstName = ref('')
const contactLastName = ref('')
const contactPhone = ref('')
const contactSaving = ref(false)
const contactError = ref('')
const contactBlocking = ref(false)
const contactUnblocking = ref(false)
const messageElementMap = new Map()
const copiedMessageId = ref('')
const forwardModal = ref(false)
const forwardTargets = ref([])
const forwardMessagePayload = ref(null)
const forwardChats = ref([])
const forwardLoading = ref(false)
const forwardSending = ref(false)
const forwardSearch = ref('')

const mediaCount = computed(() => messages.value.filter(m => m.hasMedia || m.mediaData).length)
const lastUpdatedText = computed(() => {
	if (!messages.value.length) return 'Waiting for new messages'
	const lastMessage = messages.value[messages.value.length - 1]
	return formatMessageTime(lastMessage.timestamp) || 'Just now'
})
const actionMenuId = ref('')
const filteredForwardChats = computed(() => {
	const source = (props.availableChats && props.availableChats.length) ? props.availableChats : forwardChats.value
	if (!forwardSearch.value.trim()) return source
	const term = forwardSearch.value.toLowerCase()
	return source.filter(c => {
		const name = (c.name || c.contact?.name || '').toLowerCase()
		const number = (c.contact?.number || c.id || '').toLowerCase()
		return name.includes(term) || number.includes(term)
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

function openMediaViewer(mediaData) {
	if (mediaData && mediaData.mimetype?.startsWith('image/')) {
		mediaViewer.value = {
			visible: true,
			src: `data:${mediaData.mimetype};base64,${mediaData.data}`,
			type: 'image'
		}
	}
}

function closeMediaViewer() {
	mediaViewer.value = { visible: false, src: '', type: '' }
}

function openContactModal() {
	contactError.value = ''
	contactSaving.value = false
	contactBlocking.value = false
	contactUnblocking.value = false
	contactFirstName.value = props.chat?.name || props.chat?.contact?.name || ''
	contactLastName.value = ''
	contactPhone.value = props.chat?.contact?.number || ''
	contactModal.value = true
}

async function saveContactHandler() {
	contactError.value = ''
	if (!contactPhone.value.trim() || !contactFirstName.value.trim()) {
		contactError.value = 'رقم الهاتف والاسم مطلوبان'
		return
	}
	contactSaving.value = true
	try {
		await api.saveContact({
			sessionId: props.sessionId,
			phone: contactPhone.value.trim(),
			firstName: contactFirstName.value.trim(),
			lastName: contactLastName.value.trim(),
			syncToAddressbook: true
		})
		contactModal.value = false
	} catch (err) {
		contactError.value = api.getErrorMessage ? api.getErrorMessage(err) : 'تعذر حفظ جهة الاتصال'
	} finally {
		contactSaving.value = false
	}
}

async function blockContactHandler() {
	contactError.value = ''
	if (!contactPhone.value.trim()) {
		contactError.value = 'رقم الهاتف مطلوب للحظر'
		return
	}
	contactBlocking.value = true
	try {
		await api.blockContact({ sessionId: props.sessionId, phone: contactPhone.value.trim() })
		contactModal.value = false
	} catch (err) {
		contactError.value = api.getErrorMessage ? api.getErrorMessage(err) : 'تعذر حظر جهة الاتصال'
	} finally {
		contactBlocking.value = false
	}
}

async function unblockContactHandler() {
	contactError.value = ''
	if (!contactPhone.value.trim()) {
		contactError.value = 'رقم الهاتف مطلوب لفك الحظر'
		return
	}
	contactUnblocking.value = true
	try {
		await api.unblockContact({ sessionId: props.sessionId, phone: contactPhone.value.trim() })
		contactModal.value = false
	} catch (err) {
		contactError.value = api.getErrorMessage ? api.getErrorMessage(err) : 'تعذر فك الحظر'
	} finally {
		contactUnblocking.value = false
	}
}

function setupMediaObserver() {
	if (mediaObserver.value || typeof IntersectionObserver === 'undefined') return
	mediaObserver.value = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const id = entry.target.dataset.messageId
					if (id) {
						const msg = messages.value.find((m) => m.id === id)
						if (msg && msg.hasMedia && !msg.mediaData) {
							loadMediaForMessage(msg, true)
						}
					}
					mediaObserver.value.unobserve(entry.target)
				}
			})
		},
		{
			root: messagesContainer.value || null,
			rootMargin: '200px',
			threshold: 0.1
		}
	)
}

function setMessageRef(el, message) {
	if (!message?.hasMedia) return
	if (!el) {
		const existing = messageElementMap.get(message.id)
		if (existing && mediaObserver.value) {
			mediaObserver.value.unobserve(existing)
		}
		messageElementMap.delete(message.id)
		return
	}
	setupMediaObserver()
	el.dataset.messageId = message.id
	messageElementMap.set(message.id, el)
	if (mediaObserver.value && !message.mediaData) {
		mediaObserver.value.observe(el)
	}
}

function registerAudioRef(el, id) {
	if (el) {
		audioRefs.value[id] = el
	} else {
		delete audioRefs.value[id]
	}
}

function pauseAllAudio(exceptId = null) {
	Object.entries(audioRefs.value).forEach(([key, audio]) => {
		if (key !== String(exceptId) && audio && !audio.paused) {
			audio.pause()
		}
		if (key !== String(exceptId)) {
			audioStates.value[key] = { ...(audioStates.value[key] || {}), playing: false }
		}
	})
}

function toggleAudio(id) {
	const audio = audioRefs.value[id]
	if (!audio) return
	if (!audio.paused) {
		audio.pause()
		audioStates.value[id] = { ...(audioStates.value[id] || {}), playing: false }
		return
	}
	pauseAllAudio(id)
	audio.play()
	audioStates.value[id] = { ...(audioStates.value[id] || {}), playing: true }
}

function updateAudioProgress(id) {
	const audio = audioRefs.value[id]
	if (!audio) return
	audioStates.value[id] = {
		duration: audio.duration || 0,
		current: audio.currentTime || 0,
		playing: !audio.paused
	}
}

function onAudioEnded(id) {
	const audio = audioRefs.value[id]
	if (audio) {
		audioStates.value[id] = {
			duration: audio.duration || audioStates.value[id]?.duration || 0,
			current: audio.duration || 0,
			playing: false
		}
	}
}

function audioProgressPercent(id) {
	const state = audioStates.value[id]
	if (!state || !state.duration) return 0
	return Math.min(100, Math.round((state.current / state.duration) * 100))
}

function formatAudioTime(seconds) {
	if (!seconds || Number.isNaN(seconds)) return '0:00'
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function copyMessage(message) {
	if (!message?.body) return
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(message.body)
		} else {
			const el = document.createElement('textarea')
			el.value = message.body
			document.body.appendChild(el)
			el.select()
			document.execCommand('copy')
			document.body.removeChild(el)
		}
		copiedMessageId.value = message.id
		setTimeout(() => {
			if (copiedMessageId.value === message.id) copiedMessageId.value = ''
		}, 1500)
	} catch (err) {
		console.error('Failed to copy message', err)
	}
}

function toggleActionMenu(id) {
	actionMenuId.value = actionMenuId.value === id ? '' : id
}

function closeActionMenu() {
	actionMenuId.value = ''
}

function debugForwardState(label = '') {
	console.info('[ForwardDebug]', label, {
		available: props.availableChats?.length || 0,
		forwardLoaded: forwardChats.value.length,
		filtered: filteredForwardChats.value.length,
		loading: forwardLoading.value,
		search: forwardSearch.value
	})
}

function forwardMessage(message) {
	closeActionMenu()
	forwardMessagePayload.value = message
	forwardTargets.value = []
	const shouldLoad = !props.availableChats || !props.availableChats.length || !forwardChats.value.length
	if (shouldLoad) loadForwardChats()
	debugForwardState('open modal')
	forwardModal.value = true
}

function toggleForwardTarget(chatId) {
	const idx = forwardTargets.value.indexOf(chatId)
	if (idx >= 0) {
		forwardTargets.value.splice(idx, 1)
	} else {
		forwardTargets.value.push(chatId)
	}
}

function confirmForward() {
	if (!forwardMessagePayload.value || !forwardTargets.value.length) {
		forwardModal.value = false
		return
	}
		forwardSending.value = true
		const text = forwardMessagePayload.value.body || ''
		const tasks = forwardTargets.value.map(chatId => api.sendChatMessage(props.sessionId, chatId, text))
		Promise.allSettled(tasks).finally(() => {
			forwardSending.value = false
			forwardModal.value = false
			forwardTargets.value = []
			forwardMessagePayload.value = null
		})
	}

async function loadForwardChats() {
	if (forwardLoading.value) return
	forwardLoading.value = true
	try {
		const chats = await api.getChats(props.sessionId)
		forwardChats.value = chats || []
		debugForwardState('loaded via API')
	} catch (err) {
		console.error('Failed to load chats for forward', err)
		forwardChats.value = []
	} finally {
		forwardLoading.value = false
		debugForwardState('after load attempt')
	}
}

async function loadMediaForMessage(message, auto = false) {
	if (!props.chat || !props.sessionId || message.mediaData || message.loadingMedia) {
		return
	}

	// Mark as loading
	const messageIndex = messages.value.findIndex(m => m.id === message.id)
	if (messageIndex === -1) return

	messages.value[messageIndex].loadingMedia = true

	try {
		const mediaData = await api.downloadMessageMedia(props.sessionId, props.chat.id, message.id)
		messages.value[messageIndex].mediaData = mediaData
	} catch (error) {
		console.error('Error loading media:', error)
		// Show error state
		messages.value[messageIndex].mediaError = true
		if (!auto) {
			alert('تعذر تحميل الوسائط. حاول مرة أخرى.')
		}
	} finally {
		messages.value[messageIndex].loadingMedia = false
	}
}

async function loadMessages(forceRefresh = false) {
	if (!props.chat || !props.sessionId) {
		messages.value = []
		return
	}

	// Prevent concurrent loads
	if (loadingMessages.value && !forceRefresh) {
		return
	}

	loadingMessages.value = true
	loadError.value = ''
	try {
		// Always fetch fresh messages from server
		const freshMessages = await api.getChatMessages(props.sessionId, props.chat.id, 100)
		
		// Always replace with fresh data to ensure consistency
		messages.value = freshMessages || []
		
		scrollToBottom()
	} catch (error) {
		console.error('Error loading messages:', error)
		loadError.value = api.getErrorMessage ? api.getErrorMessage(error) : 'Unable to load messages'
		// Don't clear messages on error, keep existing ones
		if (messages.value.length === 0) {
			messages.value = []
		}
	} finally {
		loadingMessages.value = false
	}
}

async function refreshMessages() {
	await loadMessages(true) // Force refresh
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
		const messageId = data.message?.id || data.messageId
		if (!messageId) return
		
		const exists = messages.value.some(msg => msg.id === messageId)
		if (!exists) {
			// Add message and sort by timestamp
			const newMessage = data.message || {
				id: messageId,
				body: data.body || '',
				timestamp: data.timestamp || Math.floor(Date.now() / 1000),
				isFromMe: data.isFromMe || false,
				type: data.type || 'chat',
				from: data.from
			}
			messages.value.push(newMessage)
			// Sort by timestamp to maintain order
			messages.value.sort((a, b) => {
				const timeA = a.timestamp || 0
				const timeB = b.timestamp || 0
				return timeA - timeB
			})
			scrollToBottom()
		}
	}
}

function handleChatUpdate(data) {
	if (data.sessionId === props.sessionId && data.chatId === props.chat?.id) {
		// Debounce refresh to avoid too many calls
		if (refreshTimer) {
			clearTimeout(refreshTimer)
		}
		refreshTimer = setTimeout(() => {
			loadMessages(true)
		}, 300)
	}
}

// Debounce timer for refresh
let refreshTimer = null

function handleMessageReceived(data) {
	if (data.sessionId === props.sessionId && data.chatId === props.chat?.id) {
		const messageId = data.messageId || data.message?.id || `msg-${Date.now()}`
		const exists = messages.value.some(msg => msg.id === messageId)
		
		if (!exists) {
			const newMessage = {
				id: messageId,
				body: data.body || data.message?.body || '',
				timestamp: data.timestamp || data.message?.timestamp || Math.floor(Date.now() / 1000),
				isFromMe: false,
				type: data.type || 'chat',
				from: data.from || data.contact?.number || data.message?.from,
				hasMedia: data.hasMedia || data.message?.hasMedia || false,
				mediaData: data.mediaData || data.message?.mediaData || null
			}
			messages.value.push(newMessage)
			// Sort by timestamp
			messages.value.sort((a, b) => {
				const timeA = a.timestamp || 0
				const timeB = b.timestamp || 0
				return timeA - timeB
			})
			scrollToBottom()
		}
	}
}

// Watch for chat changes - only reload when chat actually changes
watch(() => props.chat?.id, (newChatId, oldChatId) => {
	if (newChatId) {
		// Only reload if it's a different chat
		if (oldChatId !== newChatId) {
			messages.value = [] // Clear old messages
			loadMessages(true) // Force refresh for new chat
		}
	} else {
		messages.value = []
	}
}, { immediate: true })

watch(
	() => props.chat,
	(newChat) => {
		if (newChat) {
			contactFirstName.value = newChat.name || newChat.contact?.name || ''
			contactPhone.value = newChat.contact?.number || ''
		}
	}
)

// Sync provided chats (from chat list view) into local forwardChats as a fallback
watch(
	() => props.availableChats,
	(newVal) => {
		if (Array.isArray(newVal) && newVal.length) {
			forwardChats.value = newVal
		}
	},
	{ immediate: true }
)

// Setup socket listeners
onMounted(() => {
	onSocket('chat:message', handleChatMessage)
	onSocket('chat:update', handleChatUpdate)
	onSocket('message:received', handleMessageReceived)
	setupMediaObserver()
	debugForwardState('mounted')
})

onUnmounted(() => {
	offSocket('chat:message', handleChatMessage)
	offSocket('chat:update', handleChatUpdate)
	offSocket('message:received', handleMessageReceived)
	if (mediaObserver.value) mediaObserver.value.disconnect()
	pauseAllAudio()
})

function downloadJson(payload, filename) {
	const dataStr = JSON.stringify(payload, null, 2)
	const dataBlob = new Blob([dataStr], { type: 'application/json' })
	const url = URL.createObjectURL(dataBlob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

async function exportChatHistory() {
	if (!props.chat || !props.sessionId || exportingChat.value) return

	exportingChat.value = true
	try {
		const history = await api.getChatMessages(props.sessionId, props.chat.id, 300)
		const payload = {
			meta: {
				sessionId: props.sessionId,
				chatId: props.chat.id,
				chatName: props.chat.name || props.chat.contact?.name || 'Unknown',
				exportedAt: new Date().toISOString(),
				messageCount: history?.length || 0
			},
			chat: props.chat,
			messages: history || []
		}
		const filename = `waaku-chat-${props.chat.id}-${new Date().toISOString().split('T')[0]}.json`
		downloadJson(payload, filename)
	} catch (error) {
		const message = api.getErrorMessage ? api.getErrorMessage(error) : 'Failed to export chat'
		alert(message)
	} finally {
		exportingChat.value = false
	}
}

// Expose refresh function
defineExpose({
	refreshMessages,
	loadMessages
})
</script>
