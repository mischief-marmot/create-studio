<script setup lang="ts">
import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Link, Preview, Tailwind, Style } from '@vue-email/components'
import { tailwindConfig } from '#shared/lib/email/tailwind.js'

interface Props {
  name?: string
  actionUrl?: string
  productName?: string
  productUrl?: string
  companyName?: string
  supportEmail?: string
}

const year = new Date().getFullYear()

const props = withDefaults(defineProps<Props>(), {
  name: 'Friend',
  actionUrl: 'https://create.studio/auth/reset-password/token',
  productName: 'Create Studio',
  productUrl: 'https://create.studio',
  companyName: 'Create Studio',
  supportEmail: ''
})

</script>

<template>
  <Preview>
    Reset your password
  </Preview>
  <Html lang="en">
  <Head>
    <Style>
      table {
        border-collapse: separate;
        border-spacing: 0 10px;
    };
    </Style>
  </Head>
  <Tailwind :config="tailwindConfig">

    <Body class="h-full m-0 font-sans bg-white/80 text-gray-600 w-full">
      <Container class="w-full m-0 p-0 bg-white/80 max-w-none">
        <!-- Masthead -->
        <Section class="my-6 text-center">
          <Link :href="productUrl" class="text-[#5972ac] text-xl font-bold no-underline">
          {{ productName }}
          </Link>
        </Section>

        <!-- Email Body -->
        <Section class="w-full mx-auto p-0">
          <Container class="w-[570px] mx-auto p-0 bg-white rounded-2xl" style="border: 1px solid #d1d5db;">
            <Section class="p-6">
              <Heading as="h1" class="mt-0 text-gray-800 text-[22px] font-bold text-left">
                Hi, {{ name }}!
              </Heading>

              <Text class="my-5 text-base leading-relaxed text-gray-600">
                We received a request to reset your password. Click the button below to choose a new password.
              </Text>

              <Text class="my-5 text-base leading-relaxed text-gray-600">
                <strong>This link will expire in 1 hour.</strong>
              </Text>

              <!-- Action Button -->
              <Section class="w-full my-8 mx-auto p-0 text-center">
                <Button :href="actionUrl"
                  class="text-white bg-[#5972ac] text-lg px-5 py-3 inline-block no-underline rounded-xl shadow-md">
                  Reset Your Password
                </Button>
              </Section>

              <Text class="my-5 text-base leading-relaxed text-gray-600">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </Text>

              <Text class="my-5 text-base leading-relaxed text-gray-600">
                Thanks!
                <br/>
                The Create Team
              </Text>

              <!-- Sub copy -->
              <Hr class="mt-6 border-t border-gray-200" />

              <Text class="my-5 text-xs leading-relaxed text-gray-600">
                If you're having trouble with the button above, copy and paste the URL below into your web browser.
                <br />
                {{ actionUrl }}
              </Text>
            </Section>
          </Container>
        </Section>

        <!-- Footer -->
        <Section class="text-center">
          <Container class="w-[570px] mx-auto py-6">
            <Text class="my-5 text-sm leading-relaxed text-gray-400 text-center">
              © {{ year }} {{ productName }}. All rights reserved.
            </Text>
            <Text v-if="companyName || supportEmail" class="my-5 text-sm leading-relaxed text-gray-400 text-center">
              {{ companyName }}<br v-if="companyName && supportEmail">
              <Link :href="'mailto:' + supportEmail">{{ supportEmail }}</Link>
            </Text>
          </Container>
        </Section>
      </Container>
    </Body>
  </Tailwind>

  </Html>
</template>
