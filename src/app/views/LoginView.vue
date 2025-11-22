<template>
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4">
		<div class="w-full max-w-4xl grid lg:grid-cols-2 gap-6 items-stretch">
			<!-- Info panel -->
			<div class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0f766e] to-[#0ea5e9] text-white rounded-2xl p-8 shadow-2xl">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] opacity-80 mb-4">Waaku Secure Access</p>
					<h1 class="text-3xl font-black leading-tight mb-4">لوحة التحكم للأدمن فقط</h1>
					<p class="text-white/80 text-lg">
						أدخل بيانات الدخول للوحة التحكم. الوصول للمحادثات متاح للمستخدمين المصرح لهم بعد تسجيل الدخول.
					</p>
				</div>
				<div class="flex items-center gap-3 text-sm text-white/80">
					<span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 1.657-1.567 3-3.5 3S5 12.657 5 11s1.567-3 3.5-3S12 9.343 12 11z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11v2a7 7 0 01-14 0v-2"/>
						</svg>
					</span>
					<div>
						<p class="font-semibold">حساب الأدمن</p>
						<p>يمنح صلاحيات إنشاء/إيقاف الجلسات</p>
					</div>
				</div>
			</div>

			<!-- Form -->
			<div class="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100" dir="rtl">
				<h2 class="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
				<p class="text-sm text-gray-600 mb-6">الرجاء إدخال اسم المستخدم وكلمة المرور.</p>

				<form @submit.prevent="handleLogin" class="space-y-4">
					<div>
						<label class="block text-sm font-semibold text-gray-800 mb-1">اسم المستخدم</label>
						<div class="relative">
							<span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A6 6 0 1118 12v1a9 9 0 01-9 9"/>
								</svg>
							</span>
							<input
								v-model="username"
								type="text"
								required
								placeholder="مثال: admin"
								class="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-semibold text-gray-800 mb-1">كلمة المرور</label>
						<div class="relative">
							<span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4s-3 1.567-3 3.5S10.343 11 12 11z"/>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 20a7 7 0 0114 0v1H5z"/>
								</svg>
							</span>
							<input
								v-model="password"
								type="password"
								required
								placeholder="••••••••"
								class="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{{ error }}</p>

					<button
						:disabled="loading"
						type="submit"
						class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-60 shadow-lg"
					>
						{{ loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول' }}
					</button>

					<div class="text-xs text-gray-500 text-center">
						بعد الدخول كأدمن: إدارة الجلسات من الداشبورد. بعد الدخول كمستخدم: الوصول إلى /chat.
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../lib/api'
import { setAuth } from '../lib/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()
const route = useRoute()

const handleLogin = async () => {
	error.value = ''
	loading.value = true
	try {
		const res = await login(username.value.trim(), password.value.trim())
		setAuth({ token: res.token, role: res.role, user: res.user })
		const redirectTo = route.query.redirect || (res.role === 'admin' ? '/' : '/chat')
		router.push(redirectTo)
	} catch (err) {
		error.value = err?.response?.data?.error || 'فشل تسجيل الدخول'
	} finally {
		loading.value = false
	}
}
</script>
