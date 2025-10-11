<template>
  <div class="bg-base-200 min-h-screen font-serif">
    <!-- Header -->
    <header class=" inset-x-0 top-0 z-50 bg-base-100 shadow-sm sticky">
      <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div class="flex lg:flex-1">
          <a href="/" class="-m-1.5 p-1.5">
            <span class="sr-only">Create by Mischief Marmot</span>
            <img class="h-8 w-auto" src="/img/icon.svg" alt="Create Icon" title="Create by Mischief Marmot" />
          </a>
        </div>
        <div class="flex lg:hidden">
          <button type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            @click="mobileMenuOpen = true">
            <span class="sr-only">Open main menu</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>
        </div>
        <div class="hidden lg:flex lg:gap-x-12">
          <a v-for="item in navigation" :key="item.name" :href="item.href"
            class="text-sm/6 font-semibold text-gray-900">{{ item.name }}</a>
        </div>
        <div class="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" class="text-sm/6 font-semibold text-gray-900">Log in <span aria-hidden="true">&rarr;</span></a>
        </div>
      </nav>
      <Dialog class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50" />
        <DialogPanel
          class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div class="flex items-center justify-between">
            <a href="#" class="-m-1.5 p-1.5">
              <span class="sr-only">Your Company</span>
              <img class="h-8 w-auto"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="" />
            </a>
            <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700" @click="mobileMenuOpen = false">
              <span class="sr-only">Close menu</span>
              <XMarkIcon class="size-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/10">
              <div class="space-y-2 py-6">
                <a v-for="item in navigation" :key="item.name" :href="item.href"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">{{
                  item.name }}</a>
              </div>
              <div class="py-6">
                <a href="#"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">Log
                  in</a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>

    <main class="isolate">
      <!-- Hero section -->
      <div class="relative pt-14">
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true">
          <div
            class="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#db4f3e] to-[#5971ac] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
            style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
        </div>
        <div class="py-24 sm:py-32 lg:pb-40">
          <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-4xl text-center">
              <h1 class="text-5xl font-barrio text-balance text-gray-900 sm:text-6xl">
                <span class="">Create</span> beautiful, Schema-rich
                Cards.<br />
                <span class="block font-bold brand-gradient-text italic">Effortlessly.</span>
              </h1>
              <p class="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">Anim aute id magna aliqua ad ad
                non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.</p>
              <div class="mt-10 flex items-center justify-center gap-x-6">
                <a href="#" class="btn btn-primary">Get started</a>
                <a href="https://downloads.wordpress.org/plugin/mediavine-create.zip" class="font-semibold text-neutral">Download now <span
                    aria-hidden="true">→</span></a>
              </div>
            </div>
            <div class="mt-16 flow-root sm:mt-24">
              <div
                class="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-gray-900/10 ring-inset lg:-m-4 lg:rounded-2xl lg:p-4">
                <img src="/img/screenshots/what-would-you-like-to-create.webp" alt="App screenshot" width="2432"
                  height="1442" class="w-304 rounded-md bg-gray-50 shadow-xl ring-1 ring-gray-900/10" />
              </div>
            </div>
          </div>
        </div>
        <div
          class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true">
          <div
            class="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#5971ac] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
            style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
        </div>
      </div>

      <!-- Logo cloud -->
      <div class="mx-auto max-w-7xl">
        <div class="mt-16 flex justify-center">
          <div role="alert" class="alert relative">
            <span class="hidden md:inline">Transistor saves up to $40,000 per year, per employee by working with
              us.</span>
            <a href="#" class="font-semibold text-primary hover:text-indigo-500"><span class="absolute inset-0"
                aria-hidden="true" /> Read our case study <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
      </div>

      <!-- Feature section -->
      <div class="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
        <div class="mx-auto max-w-2xl lg:text-center">
          <h2 class="text-base/7 font-semibold text-primary">Deploy faster</h2>
          <p class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">
            Everything you need to deploy your app</p>
          <p class="mt-6 text-lg/8 text-gray-700">Quis tellus eget adipiscing convallis sit sit eget aliquet quis.
            Suspendisse eget egestas a elementum pulvinar et feugiat blandit at. In mi viverra elit nunc.</p>
        </div>
        <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div v-for="feature in features" :key="feature.name" class="relative pl-16">
              <dt class="text-base/7 font-semibold text-gray-900">
                <div class="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-primary">
                  <component :is="feature.icon" class="size-6 text-white" aria-hidden="true" />
                </div>
                {{ feature.name }}
              </dt>
              <dd class="mt-2 text-base/7 text-gray-600">{{ feature.description }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Testimonial section -->
      <div class="mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
        <div
          class="relative overflow-hidden bg-gray-900 px-6 py-20 shadow-xl sm:rounded-3xl sm:px-10 sm:py-24 md:px-12 lg:px-20">
          <img class="absolute inset-0 size-full object-cover brightness-150 saturate-0"
            src="https://images.unsplash.com/photo-1601381718415-a05fb0a261f3?ixid=MXwxMjA3fDB8MHxwcm9maWxlLXBhZ2V8ODl8fHxlbnwwfHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1216&q=80"
            alt="" />
          <div class="absolute inset-0 bg-gray-900/90 mix-blend-multiply" />
          <div class="absolute -top-56 -left-80 transform-gpu blur-3xl" aria-hidden="true">
            <div class="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-[0.45]"
              style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
          </div>
          <div class="hidden md:absolute md:bottom-16 md:left-200 md:block md:transform-gpu md:blur-3xl"
            aria-hidden="true">
            <div class="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-25"
              style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
          </div>
          <div class="relative mx-auto max-w-2xl lg:mx-0">
            <img class="h-12 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/workcation-logo-white.svg"
              alt="" />
            <figure>
              <blockquote class="mt-6 text-lg font-semibold text-white sm:text-xl/8">
                <p>“Amet amet eget scelerisque tellus sit neque faucibus non eleifend. Integer eu praesent at a. Ornare
                  arcu gravida natoque erat et cursus tortor consequat at. Vulputate gravida sociis enim nullam
                  ultricies habitant malesuada lorem ac.”</p>
              </blockquote>
              <figcaption class="mt-6 text-base text-white">
                <div class="font-semibold">Judith Black</div>
                <div class="mt-1">CEO of Tuple</div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      <!-- Pricing section -->
      <div class="py-24 sm:pt-48">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto max-w-4xl text-center">
            <h2 class="text-base/7 font-semibold text-primary">Pricing</h2>
            <p class="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl">For every level
              of Creator</p>
          </div>
          <p class="mx-auto mt-6 max-w-2xl text-center text-lg/8 text-pretty sm:text-xl/8">Quality products don't come
            free&mdash;<span class="font-sigmar  ">usually!</span>
            <br />Create's Free plan comes fully-equipped and fully-supported. Premium plans give you Premium access and
            Premium features.
          </p>
          <div class="block badge badge-success text-success-content mx-auto mt-4 italic font-sans text-lg h-8 ">
            Limited Inner Circle membership for 10 people!
          </div>
          <div
            class="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div v-for="(tier, tierIdx) in tiers" :key="tier.id"
              :class="[tier.mostPopular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8', tierIdx === 0 ? '-mr-px lg:rounded-r-none' : '', tierIdx === tiers.length - 1 ? '-ml-px lg:rounded-l-none' : '', 'flex flex-col justify-between rounded-3xl bg-base-100 p-8 inset-ring inset-ring-gray-200 xl:p-10']">
              <div>
                <div class="flex items-center justify-between gap-x-4">
                  <h3 :id="tier.id"
                    :class="[tier.mostPopular ? 'text-primary' : 'text-base-content', 'text-lg/8 font-barrio tracking-widest']">
                    {{
                    tier.name }}</h3>
                  <p v-if="tier.mostPopular"
                    class="rounded-full bg-primary px-2.5 py-1 text-xs/5 font-semibold text-primary-content">
                    Most popular</p>
                </div>
                <p class="mt-4 text-sm/6 text-gray-600">{{ tier.description }}</p>
                <p v-if="tier.alert" class="mt-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">{{
                  tier.alert }}</p>
                <div class="mt-6">
                  <!-- Regular monthly/annual pricing -->
                  <div v-if="tier.priceMonthly && !tier.price" class="flex items-baseline gap-x-1">
                    <span class="text-4xl font-semibold tracking-tight text-gray-900">{{ tier.priceMonthly }}</span>
                    <span class="text-sm/6 font-semibold text-gray-600">/month</span>
                  </div>
                  <!-- Special one-time pricing with discount -->
                  <div v-else-if="tier.price">
                    <div v-if="tier.originalPrice && tier.discount" class="flex items-center gap-x-2 mb-1">
                      <span class="text-lg text-base-content/60 line-through">{{ tier.originalPrice }}</span>
                      <span class="text-md font-semibold text-success bg-green-50 px-2 py-1 rounded-md">{{
                        tier.discount }}</span>
                    </div>
                    <div class="flex items-baseline gap-x-1">
                      <span class="text-4xl font-semibold tracking-tight text-gray-900">{{ tier.price }}</span>
                    </div>
                  </div>
                </div>
                <div class="mt-8 space-y-6">
                  <!-- Regular features -->
                  <ul role="list" class="space-y-3 text-sm/6 text-gray-600">
                    <li v-for="feature in tier.features" :key="feature" class="flex gap-x-3">
                      <CheckIcon v-if="tier.id != 'tier-inner-circle'" class="h-6 w-5 flex-none text-primary"
                        aria-hidden="true" />
                      <StarIcon v-if="tier.id == 'tier-inner-circle'" class="h-6 w-5 flex-none text-accent"
                        aria-hidden="true" />
                      {{ feature }}
                    </li>
                  </ul>

                  <!-- Coming soon features -->
                  <div v-if="tier.comingSoonFeatures && tier.comingSoonFeatures.length > 0"
                    class="bg-base-200 text-base-content p-4 rounded-lg">
                    <div class="flex gap-x-1 mb-1">
                      <h4 class="text-lg font-barrio tracking-widest">Coming Soon:</h4>
                    </div>
                    <ul role="list" class="space-y-1 text-sm/6">
                      <li v-for="feature in tier.comingSoonFeatures" :key="feature" class="flex gap-x-3">
                        <ClockIcon class="h-6 w-5 flex-none text-primary" aria-hidden="true" /> {{ feature }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <a :href="tier.href" :aria-describedby="tier.id"
                :class="[tier.mostPopular ? 'bg-primary text-white shadow-xs hover:bg-indigo-500' : 'text-primary inset-ring inset-ring-indigo-200 hover:inset-ring-indigo-300', 'mt-8 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary']">Buy
                plan</a>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQs -->
      <div class="mx-auto max-w-2xl px-6 pb-8 sm:pt-12 sm:pb-24 lg:max-w-7xl lg:px-8 lg:pb-32">
        <h2 class="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">Frequently asked questions</h2>
        <dl class="mt-20 divide-y divide-gray-900/10">
          <div v-for="faq in faqs" :key="faq.id" class="py-8 first:pt-0 last:pb-0 lg:grid lg:grid-cols-12 lg:gap-8">
            <dt class="text-base/7 font-semibold text-gray-900 lg:col-span-5">{{ faq.question }}</dt>
            <dd class="mt-4 lg:col-span-7 lg:mt-0">
              <p class="text-base/7 text-gray-600">{{ faq.answer }}</p>
            </dd>
          </div>
        </dl>
      </div>

      <!-- CTA section -->
      <div class="relative -z-10 mt-32 px-6 lg:px-8">
        <div
          class="absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:top-auto sm:right-[calc(50%-6rem)] sm:bottom-0 sm:translate-y-0 sm:transform-gpu sm:justify-end"
          aria-hidden="true">
          <div class="aspect-1108/632 w-277 flex-none bg-linear-to-r from-[#ff80b5] to-[#9089fc] opacity-25"
            style="clip-path: polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)" />
        </div>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl">Boost your
            productivity. Start using our app today.</h2>
          <p class="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-gray-600">Incididunt sint fugiat pariatur cupidatat
            consectetur sit cillum anim id veniam aliqua proident excepteur commodo do ea.</p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <a href="#"
              class="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Get
              started</a>
            <a href="#" class="text-sm/6 font-semibold text-gray-900">Learn more <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div
          class="absolute top-full right-0 left-1/2 -z-10 hidden -translate-y-1/2 transform-gpu overflow-hidden blur-3xl sm:block"
          aria-hidden="true">
          <div class="aspect-1155/678 w-288.75 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative mx-auto mt-32 max-w-7xl px-6 lg:px-8">
      <div class="border-t border-gray-900/10 py-16 sm:py-24 lg:py-32">
        <div class="xl:grid xl:grid-cols-3 xl:gap-8">
          <img class="h-9" src="/img/icon.svg"
            alt="Create by Mischief Marmot" />
          <div class="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm/6 font-semibold text-gray-900">Solutions</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.solutions" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm/6 font-semibold text-gray-900">Support</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.support" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm/6 font-semibold text-gray-900">Company</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.company" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm/6 font-semibold text-gray-900">Legal</h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li v-for="item in footerNavigation.legal" :key="item.name">
                    <a :href="item.href" class="text-sm/6 text-gray-600 hover:text-gray-900">{{ item.name }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'

const page = {
  title: 'Create by Mischief Marmot - Recipe Cards & Schema Generator for Bloggers',
  description: 'Complete tool for creating SEO-optimized recipe cards, how-to guides, and FAQs with automatic Google Schema.org structured data. A plugin for bakers, makers, and adventure-takers.',
}

useSeoMeta({
  title: page.title,
  description: page.description,
  ogTitle: 'Create by Mischief Marmot - Recipe Cards & Schema Generator',
  ogDescription: 'The complete tool for creating and publishing recipes, how-to guides, and FAQs with automatic Google Schema.org structured data. Lightweight, speed-focused, and SEO-optimized.',
  ogImage: '/img/create-og-image.jpg',
  ogUrl: 'https://getcreateplugin.com',
  ogType: 'website',
  twitterTitle: 'Create by Mischief Marmot - Recipe Cards & Schema Generator',
  twitterDescription: 'Complete tool for creating SEO-optimized recipe cards with automatic nutrition calculator & Google Rich Snippets support.',
  twitterImage: '/img/create-twitter-image.jpg',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
  author: 'Mischief Marmot',
  keywords: 'recipe cards, schema generator, recipe plugin, SEO recipes, structured data, Google rich snippets, how-to guides, FAQ schema, nutrition calculator, food blogger tools, recipe SEO, content cards, schema.org, recipe markup',
  applicationName: 'Create by Mischief Marmot',
  generator: 'Nuxt 3',
  publisher: 'Mischief Marmot',
  category: 'SEO Tools',
})

useHead({
  title: page.title,
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@100;200;300;400;500;600;700&family=Sigmar+One&family=Barrio&family=Funnel+Display:wght@300;400;500;600;700&display=swap' },
    { rel: 'canonical', href: 'https://mischiefmarmot.com/products/create' },
  ],
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#4f46e5' },
    { property: 'fb:app_id', content: 'your-fb-app-id' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Create by Mischief Marmot',
          applicationCategory: 'WebApplication',
          operatingSystem: 'Any',
          description: 'Complete tool for creating and publishing recipes, HowTo, DIY, Lists, and other schema types on your site with automatic Google Schema.org structured data.',
          url: 'https://getcreateplugin.com',
          downloadUrl: 'https://wordpress.org/plugins/mediavine-create/',
          softwareVersion: '1.9.15',
          datePublished: '2025-08-05',
          dateModified: new Date().toISOString().split('T')[0],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.1',
            ratingCount: '17',
            bestRating: '5',
            worstRating: '1',
          },
          author: {
            '@type': 'Organization',
            name: 'Mischief Marmot',
            url: 'https://mischiefmarmot.com',
            sameAs: [
              'https://www.mediavine.com/products/create/',
              'https://wordpress.org/plugins/mediavine-create/',
            ],
          },
          featureList: [
            'Recipe Cards with Schema.org markup',
            'How-To Guides with structured data',
            'List Schema generation',
            'Automatic nutrition calculator',
            'Google Rich Snippets support',
            'Mobile responsive design',
            'SEO optimized output',
            'One-click schema validation',
            'Multiple beautiful themes',
            'Ad-ready layouts',
            'Live preview with Gutenberg',
            'Recipe and How-to importers',
          ],
          screenshot: 'https://getcreateplugin.com/img/create-screenshot.jpg',
          softwareRequirements: 'WordPress 6.3+, PHP 7.4+',
          releaseNotes: 'Supports multiple Google Schema.org types including Recipes, How-to guides, and Lists',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Create by Mischief Marmot - Recipe Cards & Schema Generator',
          url: 'https://getcreateplugin.com',
          description: 'Complete tool for creating SEO-optimized recipe cards, how-to guides, and FAQs with automatic Google Schema.org structured data.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://getcreateplugin.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Mischief Marmot',
            url: 'https://mischiefmarmot.com',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Mischief Marmot',
          url: 'https://mischiefmarmot.com',
          logo: 'https://getcreateplugin.com/img/mischief-marmot-logo.png',
          description: 'Developer of Create - the complete tool for creating SEO-optimized recipe cards and structured data for content creators.',
          sameAs: [
            'https://www.mediavine.com',
            'https://wordpress.org/plugins/mediavine-create/',
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Create by Mischief Marmot',
          description: 'A plugin for bakers, makers, and adventure-takers. Complete tool for creating and publishing recipes, how-to guides, and other schema types.',
          brand: {
            '@type': 'Brand',
            name: 'Mischief Marmot',
          },
          category: 'WordPress Plugin',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'Mischief Marmot',
            },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.1',
            reviewCount: '18',
          },
          audience: {
            '@type': 'Audience',
            audienceType: 'Food Bloggers, Content Creators, Recipe Writers',
          },
        },
      ]),
    },
  ],
})
import {
  ArrowPathIcon,
  Bars3Icon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  LockClosedIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { CheckIcon, ClockIcon } from '@heroicons/vue/20/solid'
import { StarIcon } from '@heroicons/vue/20/solid'


const navigation = [
  { name: 'Product', href: '#' },
  { name: 'Features', href: '#' },
  { name: 'Marketplace', href: '#' },
  { name: 'Company', href: '#' },
]
const features = [
  {
    name: 'Push to deploy',
    description:
      'Morbi viverra dui mi arcu sed. Tellus semper adipiscing suspendisse semper morbi. Odio urna massa nunc massa.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'SSL certificates',
    description:
      'Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget. Sem sodales gravida quam turpis enim lacus amet.',
    icon: LockClosedIcon,
  },
  {
    name: 'Simple queues',
    description:
      'Quisque est vel vulputate cursus. Risus proin diam nunc commodo. Lobortis auctor congue commodo diam neque.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Advanced security',
    description:
      'Arcu egestas dolor vel iaculis in ipsum mauris. Tincidunt mattis aliquet hac quis. Id hac maecenas ac donec pharetra eget.',
    icon: FingerPrintIcon,
  },
]
const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Freely create unlimited recipe, how-to, and list cards!',
    features: [
    'Unlimited cards', 
    'Nutrition',
    'Recommended Products',
    '5 beautiful themes', 
    'Access to Create Facebook Group', 
    'WordPress Forum support'],
    mostPopular: false,
  },
  {
    name: 'Premium',
    id: 'tier-premium',
    href: '#',
    priceMonthly: '$15',
    priceAnnual: '$150',
    description: 'Premium support, attention, and updates.',
    features: [
      'Automatic Nutrition calculation',
      'Email and Discord support',
      'Premium Facebook group',
      '24-hour support response time',
      'Access to new themes',
      'Access to new features',
    ],
    comingSoonFeatures: [
      'Immersive Cook Mode',
      'New premium themes',
      'Review Triggers',
      'PDF Exports',
      'Integrations',
      'MiniCards/Snippets',
    ],
    mostPopular: true,
  },
  {
    name: 'Inner Circle',
    id: 'tier-inner-circle',
    href: '#',
    priceMonthly: null,
    priceAnnual: null,
    originalPrice: '$2000',
    discount: '$750 off',
    price: 'One-time $1,250',
    description: 'Exclusive access to me, early feature previews, and a lifetime license.',
    alert: 'Limited to 10 members!',
    features: [
      'Initial 90-minute 1:1 onboarding call',
      'Lifetime Premium access',
      'Direct access to me via email, Discord, DMs, ',
      'Early access to new features',
      'Influence the product roadmap',
      'Quarterly 30-minute 1:1 check-in calls',
      'Site and name on Create website',
      'Exclusive Inner Circle-only swag',
    ],
    mostPopular: false,
  },
]
const faqs = [
  {
    id: 1,
    question: "What's the best thing about Switzerland?",
    answer:
      "I don't know, but the flag is a big plus. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 2,
    question: 'How do you make holy water?',
    answer:
      'You boil the hell out of it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam aut tempora vitae odio inventore fuga aliquam nostrum quod porro. Delectus quia facere id sequi expedita natus.',
  },
  {
    id: 3,
    question: 'What do you call someone with no body and no nose?',
    answer:
      'Nobody knows. Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa, voluptas ipsa quia excepturi, quibusdam natus exercitationem sapiente tempore labore voluptatem.',
  },
  {
    id: 4,
    question: 'Why do you never see elephants hiding in trees?',
    answer:
      "Because they're so good at it. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas cupiditate laboriosam fugiat.",
  },
  {
    id: 5,
    question: "Why can't you hear a pterodactyl go to the bathroom?",
    answer:
      'Because the pee is silent. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsam, quas voluptatibus ex culpa ipsum, aspernatur blanditiis fugiat ullam magnam suscipit deserunt illum natus facilis atque vero consequatur! Quisquam, debitis error.',
  },
  {
    id: 6,
    question: 'Why did the invisible man turn down the job offer?',
    answer:
      "He couldn't see himself doing it. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eveniet perspiciatis officiis corrupti tenetur. Temporibus ut voluptatibus, perferendis sed unde rerum deserunt eius.",
  },
]
const footerNavigation = {
  solutions: [
    { name: 'Hosting', href: '#' },
    { name: 'Data services', href: '#' },
    { name: 'Uptime monitoring', href: '#' },
    { name: 'Enterprise services', href: '#' },
    { name: 'Analytics', href: '#' },
  ],
  support: [
    { name: 'Submit ticket', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
  ],
  legal: [
    { name: 'Terms of service', href: '#' },
    { name: 'Privacy policy', href: '#' },
    { name: 'License', href: '#' },
  ],
}

const mobileMenuOpen = ref(false)
</script>