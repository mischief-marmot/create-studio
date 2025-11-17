<template>
  <NuxtLayout name="main">
  <div class="min-h-screen">
    <!-- Hero Section with Introduction -->
    <section class="hero min-h-[60vh] bg-gradient-to-b from-success via-success/65 to-success/45">
      <div class="hero-content text-center">
        <div class="max-w-3xl">
          <div class="avatar mb-6">
            <div class="w-48 rounded-full">
              <img src="/img/misc/jm.jpg" alt="JM (or John-Michael for long)" />
            </div>           
          </div>
          <h1 class="mb-4 text-5xl font-bold">Hi, I'm JM!</h1>
          <p class="text-base-content/80 mb-2 text-xl">But a few people call me John-Michael ;) </p>
          <p class="text-lg leading-relaxed">
            I'm a husband, father, software engineer, and product-builder. 
            One of my passions is creating tools to help Creators <em>work less</em> and <em><strong>live more</strong></em>.
          </p>
          <div class="flex flex-wrap justify-center gap-4 mt-8">
            <div class="badge badge-lg badge-secondary gap-2">
              <CodeBracketIcon class="w-4 h-4" />
              20+ Years Coding
            </div>
            <div class="badge badge-lg badge-accent gap-2">
              <HeartIcon class="w-4 h-4" />
              Husband & Father of Three
            </div>
            <div class="badge badge-lg badge-success gap-2">
              <RocketLaunchIcon class="w-4 h-4" />
              Product Creator
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Journey Timeline -->
    <section class="bg-gradient-to-b from-success/45 to-base-100 px-4 py-16">
      <div class="container max-w-6xl mx-auto">
        <h2 class="mb-12 text-4xl font-bold text-center">My Journey</h2>

        <ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
          <!-- 2005 - The Beginning -->
          <li>
            <hr />
            <div class="timeline-start">
              <time class="font-mono italic">2005</time>
              <div class="mb-2 text-lg font-black">Where it started</div>
              <div class="card bg-base-200 shadow-xl">
                <div class="card-body text-md">
                  <p>Twenty years ago, I was a high schooler learning to create something from nothing using PHP.</p>
                  <p>My skills have improved a bit since, but I'm stil that kid: stoked that I get to <strong>make things</strong>.</p>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-success w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>

          <!-- Getting Married & Traveling -->
          <li>
            <hr />
            <div class="timeline-end">
              <time class="font-mono italic">2014-2015</time>
              <div class="mb-2 text-lg font-black">Adventures</div>
              <div class="card bg-base-200 shadow-xl">
                <figure>
                  <img src="/img/misc/wedding.jpg" alt="Getting married" class="aspect-video object-cover w-full rounded-t-lg" />
                </figure>
                <div class="card-body text-md">
                  <p>In 2014, I married the love of my life, Angélique. We worked a bit and traveled a lot. One day, we met a Ukranian family traveling through Malaysia. I asked the husband what he did that allowed him to work while traveling—<strong>he made websites</strong>.</p>
                  <p>That same night, in our tiny AirBNB room, I started a course on WordPress site development. The rest is history (that I'm about to tell you)!</p>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-secondary w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>

          <!-- Web Agency Years -->
          <li>
            <hr />
            <div class="timeline-start">
              <time class="font-mono italic">2016-2018</time>
              <div class="mb-2 text-lg font-black">The start of a career</div>
              <div class="card bg-base-200 shadow-xl">
                <div class="card-body text-md">
                  <p>A few months later, I started my professional software career at a web agency, designing and building websites for corporate clients. I quickly learned that I wanted to build products to help <strong>people</strong>, things that I could improve on and which made an impact in the lives of others.</p>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-primary w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>

          <!-- Mediavine & Create -->
          <li>
            <hr />
            <div class="timeline-end">
              <time class="font-mono italic">2018-2021</time>
              <div class="mb-2 text-lg font-black">Mediavine, Create & Fatherhood</div>
              <div class="card bg-base-200 shadow-xl">
                <figure>
                  <img src="/img/misc/my-fam.jpg" alt="Family" class="aspect-video object-cover w-full rounded-t-lg" />
                </figure>
                <div class="card-body text-md">
                  <p>In 2018, we had our first son and I joined Mediavine to work on Create, which we launched later that year.</p>
                  <p>Over the next three years, our family grew to three boys - Wilder, Ransom, and Banner. I had the privilege of continuously improving Create, watching it grow, and seeing more than ten thousand publishers use it to make their lives easier.</p>
                  <div class="stats stats-horizontal bg-base-300 border-base-300 mt-4 shadow">
                    <div class="stat">
                      <div class="stat-title font-semibold">Years on Create</div>
                      <div class="stat-value text-success">3</div>
                    </div>
                    <div class="stat">
                      <div class="stat-title font-semibold">Publishers Served</div>
                      <div class="stat-value text-success">10,000+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-info w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>

          <!-- Management & Reflection -->
          <li>
            <hr />
            <div class="timeline-start">
              <time class="font-mono italic">2021-2024</time>
              <div class="mb-2 text-lg font-black">Leadership & Longing</div>
              <div class="card bg-base-200 shadow-xl">
                <div class="card-body text-md">
                  <p>When Create entered maintenance mode in 2021, I moved into management at Mediavine. My family tried our hand at raising sheep, breeding chickens, and lived a life that was full and rich. But, as time went on, I missed building products.</p>
                  <p>I missed the hands-on work, and interacting with Creators, and directly creating value through a tool that so many publishers relied on every day, the product I wanted to keep improving and evolving.</p>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-dark-plum w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>

          <!-- New Beginning -->
          <li>
            <hr />
            <div class="timeline-end">
              <time class="font-mono italic">2025</time>
              <div class="mb-2 text-lg font-black">A New Chapter</div>
              <div class="card bg-gradient-to-br to-amber-300/20 from-accent/20 border-accent border-2 shadow-xl">
                <figure class="flex justify-center px-4 pt-4">
                  <LogoFull height="80" />
                </figure>
                <div class="card-body text-md">
                  <p class="font-semibold">So I talked with Eric and the Mediavine team and we found a way to bring Create back to the people who needed it.</p>
                  <p>Now, as an independent Creator and business-owner, I'm working full-time on Create. I'm turning it back into a product Creators love—one that simplifies their lives, removes complexity, and feels good to use.</p>
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-error w-5 h-5">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <hr />
          </li>
        </ul>
      </div>
    </section>

    <!-- Vision Section -->
    <section class="bg-gradient-to-b from-base-100 to-success px-4 py-16">
      <div class="container max-w-6xl mx-auto">
        <div class="mb-12">
          <img src="/img/misc/mountain-top.jpg" alt="Mountain top - new perspective" class="aspect-video shadow-3xl object-cover w-full rounded-lg" />
        </div>
        <h2 class="mb-12 text-4xl font-bold text-center">What's Next</h2>

        <div class="lg:grid-cols-2 grid gap-8 mb-12">
          <!-- Create 2.0 Card -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body text-lg">
              <h3 class="card-title mb-4 text-3xl">
                <SparklesIcon class="text-success animate-pulse size-8" />
                Create 2.0 <span class="badge badge-success badge-lg">2025</span>
              </h3>
              <p>Create 2.0 brings more than security patches and compatability improvments. It's the beginning of a tool that works anywhere, not just in WordPress.</p>
              <p class="mb-4">Starting with <strong>Interactive Mode</strong> and <strong>Servings Adjustments</strong>, the reader experience will be enhanced by a cloud-hosted app: Create Studio.</p>
              <div class="divider">Key Features</div>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <CheckCircleIcon class="shrink-0 size-6 text-success mt-2" />
                  <span><strong>Interactive Mode:</strong> Dynamic, engaging content experiences</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircleIcon class="shrink-0 size-6 text-success mt-2" />
                  <span><strong>Servings Adjustments:</strong> Smart recipe scaling</span>
                </li>
                <li class="flex items-start gap-2">
                  <CheckCircleIcon class="shrink-0 size-6 text-success mt-2" />
                  <span><strong>Platform Agnostic:</strong> Lays the foundation for a product that works on any website, not just WordPress</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Create Studio Card -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body text-lg">
              <h3 class="card-title mb-4 text-3xl">
                <Solo class="animate-spin-slow size-8" />
                Create Studio <span class="badge badge-accent badge-lg">2026</span>
              </h3>
              <p>
                Create Studio will be a standalone platform that brings Create's power to publishers everywhere, regardless of their CMS.
              </p>
              <p class="mb-4">
                It will work faster, have fewer conflicts with other plugins or themes, and allow use on multiple sites.
              </p>
              <div class="divider">The Approach</div>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <PuzzlePieceIcon class="shrink-0 size-6 text-accent mt-2" />
                  <span><strong>Rapid development: </strong>Widget-based architecture like Grow or Slickstream</span>
                </li>
                <li class="flex items-start gap-2">
                  <GlobeAmericasIcon class="shrink-0 size-6 text-accent mt-2" />
                  <span><strong>Use Anywhere: </strong>Manage cards in <strong><em>any</em></strong> CMS.</span>
                </li>
                <li class="flex items-start gap-2">
                  <UserGroupIcon class="shrink-0 size-6 text-accent mt-2" />
                  <span><strong>More Creating: </strong>Fewer issues with deployments means more time creating content!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Mission Statement -->
        <div class="hero bg-base-200 rounded-box shadow-xl">
          <div class="hero-content py-12 text-center">
            <div class="max-w-3xl">
              <h3 class="mb-6 text-3xl font-bold">My Mission</h3>
              <p class="mb-6 text-lg leading-relaxed">
                To build Create into a business that serves independent creators without getting in their way:
                A tool that <em class="text-success"><strong>adds value</strong></em> to publishers' work with ease, and a bit of fun. 😉
              </p>
              <p class="text-base-content text-xl font-semibold">
                Simple. Effective. Fun!
              </p>
            </div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="text-success-content mt-12 text-center">
          <h3 class="mb-6 text-2xl font-bold">Join the Journey</h3>
          <p class="max-w-2xl mx-auto mb-8 text-lg">
            Whether you're a longtime Create user or discovering us for the first time,
            I'm excited to build the future of content creation tools together.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <NuxtLink to="/" class="btn btn-primary btn-lg">
              <ArrowLeftIcon class="w-5 h-5" />
              Explore Create
            </NuxtLink>
            <NuxtLink to="/news" class="btn btn-secondary btn-lg">
              <NewspaperIcon class="w-5 h-5" />
              Latest Updates
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="bg-base-200 px-4 py-16">
      <div class="container max-w-xl mx-auto text-center">
        <h3 class="mb-4 text-2xl font-bold">Let's Connect</h3>
        <p class="mb-8 text-lg">
          I'd love to hear your thoughts, ideas, and feedback as we build Create's next chapter.
        </p>
        <div class="flex justify-center gap-4">
          <a class="btn btn-circle btn-lg btn-outline"
          href="mailto:support@create.studio"
           title="Email me">
            <EnvelopeIcon class="w-6 h-6" />
          </a>
          <!-- <button class="btn btn-circle btn-lg btn-outline" title="Social">
            <LinkIcon class="w-6 h-6" />
          </button>
          <button class="btn btn-circle btn-lg btn-outline" title="Social">
            <LinkIcon class="w-6 h-6" />
          </button> -->
        </div>
      </div>
    </section>
  </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  CodeBracketIcon,
  HeartIcon,
  RocketLaunchIcon,
  SparklesIcon,
  CheckCircleIcon,
  PuzzlePieceIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  NewspaperIcon,
  EnvelopeIcon,
} from '@heroicons/vue/20/solid'
import Solo from '../components/Logo/Solo.vue';

// JSON-LD Schema for the about page
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: 'John-Michael',
    alternateName: 'JM',
    description: 'Software engineer, product builder, and founder of Create Studio. Building tools that empower independent publishers.',
    url: 'https://create.studio/about',
    jobTitle: 'Owner & Product Builder',
    knowsAbout: ['Software Engineering', 'Product Development', 'Publishing Technology', 'Web Development'],
  },
  about: {
    '@type': 'Thing',
    name: 'Create Studio',
    description: 'A platform for creating structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards.',
    url: 'https://create.studio'
  }
}

// Page metadata
useHead({
  title: 'About - JM and the Create Story',
  meta: [
    {
      name: 'description',
      content: 'Learn about John-Michael (JM), the journey of Create, and the vision for Create 2.0 and Create Studio - building tools that empower independent publishers.'
    },
    {
      name: 'og:title',
      content: 'About JM - Founder of Create Studio'
    },
    {
      name: 'og:description',
      content: 'Discover the story of Create, from a high school PHP enthusiast to building tools for publishers worldwide.'
    },
    {
      name: 'og:type',
      content: 'profile'
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLdSchema)
    }
  ]
})
</script>