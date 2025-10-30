<script setup lang="ts">
import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Link, Preview, Tailwind, Style } from '@vue-email/components'

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
  name: 'there',
  actionUrl: 'https://create.studio/validate-email/token',
  productName: 'Create Studio',
  productUrl: 'https://create.studio',
  companyName: 'Create Studio',
  supportEmail: ''
})

const tailwindConfig = {
  theme: {
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["14px", { lineHeight: "20px" }],
      base: ["16px", { lineHeight: "24px" }],
      lg: ["18px", { lineHeight: "28px" }],
      xl: ["20px", { lineHeight: "28px" }],
      "2xl": ["24px", { lineHeight: "32px" }],
      "3xl": ["30px", { lineHeight: "36px" }],
      "4xl": ["36px", { lineHeight: "36px" }],
      "5xl": ["48px", { lineHeight: "1" }],
      "6xl": ["60px", { lineHeight: "1" }],
      "7xl": ["72px", { lineHeight: "1" }],
      "8xl": ["96px", { lineHeight: "1" }],
      "9xl": ["144px", { lineHeight: "1" }],
    },
    spacing: {
      px: "1px",
      0: "0",
      0.5: "2px",
      1: "4px",
      1.5: "6px",
      2: "8px",
      2.5: "10px",
      3: "12px",
      3.5: "14px",
      4: "16px",
      5: "20px",
      6: "24px",
      7: "28px",
      8: "32px",
      9: "36px",
      10: "40px",
      11: "44px",
      12: "48px",
      14: "56px",
      16: "64px",
      20: "80px",
      24: "96px",
      28: "112px",
      32: "128px",
      36: "144px",
      40: "160px",
      44: "176px",
      48: "192px",
      52: "208px",
      56: "224px",
      60: "240px",
      64: "256px",
      72: "288px",
      80: "320px",
      96: "384px",
    },
  },
}
</script>

<template>
  <Preview>
    Hello
  </Preview>
  <Html lang="en">
  <Head>
    <Style>
      table {
        border-collapse: separate;
        border-spacing: 0 10px; /* 0px horizontal spacing, 10px vertical spacing between cells */
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
                Please validate your email to unlock all Create features.
              </Text>

              <!-- Action Button -->
              <Section class="w-full my-8 mx-auto p-0 text-center">
                <Button :href="actionUrl"
                  class="text-white bg-[#5972ac] text-lg px-5 py-3 inline-block no-underline rounded-xl shadow-md">
                  Validate Your Email
                </Button>
              </Section>

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
