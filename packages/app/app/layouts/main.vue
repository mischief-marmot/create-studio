<template>
    <div class="min-h-screen">
        <!-- Navigation Bar -->
        <nav :class="[
            scrollPosition > 64 ? 'md:bg-transparent ' : '',
            'navbar sticky bg-base-100 top-0 text-base-content sm:pt-6 z-50 sm:px-8',
            'transition-colors duration-0'
        ]">
            <div class="navbar-start">
                <!-- Mobile Menu Dropdown -->
                <div v-if="navLinks && Object.keys(navLinks).length > 0" class="dropdown">
                    <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul tabindex="0"
                        class="menu menu-lg dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                        <li v-for="(text, href) in navLinks" :key="String(href)">
                            <a :href="String(href)">{{ text }}</a>
                        </li>
                    </ul>
                </div>
                <a href="/" :class="[
                    scrollPosition > 64 ? '' : ''
                ]">
                    <LogoFull height="32" width="auto" className="dark:text-base-content" />
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
    </div>
</template>

<script setup lang="ts">
interface NavLinksMap {
  [href: string]: string
}

const attrs = useAttrs()
const navLinks = computed(() => attrs.navLinks as NavLinksMap | undefined)

const scrollPosition = ref(0)

onMounted(() => {
  scrollPosition.value = window.scrollY

  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})
</script>