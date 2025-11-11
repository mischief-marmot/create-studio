<template>
	<div class="flex flex-col min-h-screen">
	
		<!-- Navigation Bar -->
		<nav :class="[
            scrollPosition > 64 ? 'bg-transparent ' : '',
            'navbar sticky bg-base-100 top-0 text-base-content sm:pt-3 z-50 sm:px-8',
            'transition-colors duration-0'
        ]">
			<div class="navbar-start">
				<!-- Mobile Menu Dropdown -->
				<div v-if="navLinks && Object.keys(navLinks).length > 0" class="dropdown">
					<div tabindex="0" role="button" class="bg-base-100 text-base-content ring-1 ring-base-content lg:hidden z-100 p-3 rounded-full cursor-pointer">
						<Solo height="32" />
					</div>
					<ul tabindex="0" class="menu menu-lg dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li v-for="(text, href) in navLinks" :key="String(href)">
							<a :href="String(href)">{{ text }}</a>
						</li>
					</ul>
				</div>
				<a href="/" :class="[
                    scrollPosition > 64 ? 'bg-base-100 p-3 text-base-content ring-1 ring-base-content rounded-full' : '',
									navLinks ? 'hidden lg:block' : ''
                ]"
								class="bg-base-100"
								>
					<component :is="scrollPosition > 64 ? Solo : Full" :height="scrollPosition > 64 ? 24: 32"  />
				</a>
			</div>
			<!-- Desktop Navigation Links -->
			<div v-if="navLinks && Object.keys(navLinks).length > 0" class="navbar-center lg:flex hidden px-6" :class="[
                scrollPosition > 64 ? 'bg-base-100 text-base-content ring-1 ring-base-content rounded-full' : ''
            ]">
				<ul class="menu menu-horizontal text-md">
					<li v-for="(text, href) in navLinks" :key="String(href)">
						<a class="px-6 rounded-full" :href="String(href)">{{ text }}</a>
					</li>
				</ul>
			</div>
			<div class="navbar-end">
				<a href="/auth/login" class="btn btn-primary btn-sm sm:btn-md hidden rounded-full" :class="[
                    scrollPosition > 64 ? 'hidden' : ''
                ]">Sign In</a>
			</div>
		</nav>
		<main>
			<slot />
		</main>

		<div class="bg-base-200 grow-1 flex justify-center w-full">
			<div class="max-w-7xl w-full">
				<footer class="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
					<nav>
						<h6 class="footer-title">Product</h6>
						<NuxtLink class="link link-hover" href="/plugin">Create Plugin</NuxtLink>
					</nav>
					<nav>
						<h6 class="footer-title">Features</h6>
						<NuxtLink class="link link-hover" href="/#features">Overview</NuxtLink>
						<NuxtLink class="link link-hover" href="/#interactive-mode">Interactive Mode</NuxtLink>
					</nav>
					<nav>
						<h6 class="footer-title">Company</h6>
						<NuxtLink class="link link-hover" href="/news">News</NuxtLink>
					</nav>
					<nav></nav>
				</footer>
				<footer class="footer bg-base-200 text-base-content border-base-300 sm:flex-row flex flex-col items-center justify-between gap-4 px-10 py-4 border-t">
					<aside class="items-center grid-flow-col">
						<LogoSolo class="size-16" />
						<p>
							Create Studio
							<br />
							Mischief Marmot LLC
							<br />
							Established 2025
						</p>
					</aside>

					<!-- Legal Links -->
					<nav class="flex flex-wrap justify-center gap-4 text-sm">
						<NuxtLink to="/legal/privacy" class="link link-hover">Privacy Policy</NuxtLink>
						<NuxtLink to="/legal/cookies" class="link link-hover">Cookies</NuxtLink>
						<NuxtLink to="/legal/terms" class="link link-hover">Terms</NuxtLink>
						<button @click="openCookieSettings" class="link link-hover cursor-pointer">
							Cookie Settings
						</button>
					</nav>

					<nav class="md:place-self-center md:justify-self-end">
						<div class="grid grid-flow-col gap-4">
							<a class="twitter hidden">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current">
									<path
										d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z">
									</path>
								</svg>
							</a>
							<a class="youtube hidden">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current">
									<path
										d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z">
									</path>
								</svg>
							</a>
							<a class="facebook" href="www.facebook.com/groups/createstudioapp/">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current">
									<path
										d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z">
									</path>
								</svg>
							</a>
						</div>
					</nav>
				</footer>
			</div>
		</div>


		<div class="bottom-4 right-4 fixed" :class="scrollPosition < 64 ? 'hidden' : ''">
			<!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
			<button role="button" @click="scrollToTop" class="btn btn-lg btn-square btn-primary">
				<ArrowUpIcon class="size-6" />
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ArrowUpIcon } from '@heroicons/vue/20/solid'
import Solo from '../components/Logo/Solo.vue'
import Full from '../components/Logo/Full.vue'
import { useConsentStore } from '~/stores/consent'

interface NavLinksMap {
  [href: string]: string
}

const attrs = useAttrs()
const navLinks = computed(() => attrs.navLinks as NavLinksMap | undefined)

const scrollPosition = ref(0)
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openCookieSettings = () => {
  const consentStore = useConsentStore()
  consentStore.openCustomizeModal()
}

onMounted(() => {
	scrollPosition.value = window.scrollY
	
  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})
</script>