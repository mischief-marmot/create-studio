<script setup lang="ts">
import { Html, Head, Body, Container, Section, Heading, Text, Button, Link, Preview, Img, Style } from '@vue-email/components'

interface Highlight {
  title: string
  description: string
  type: 'feature' | 'enhancement' | 'fix' | 'breaking'
  imageUrl?: string
}

interface Props {
  title?: string
  version?: string
  product?: string
  description?: string
  heroImageUrl?: string
  highlights?: Highlight[]
  releaseUrl?: string
  unsubscribeUrl?: string
  productName?: string
  productUrl?: string
  companyName?: string
}

const year = new Date().getFullYear()

const props = withDefaults(defineProps<Props>(), {
  title: 'New Release',
  version: '1.0.0',
  product: 'Create Plugin',
  description: 'Check out what\'s new in this release.',
  heroImageUrl: '',
  highlights: () => [],
  releaseUrl: 'https://create.studio/releases',
  unsubscribeUrl: '#',
  productName: 'Create Studio',
  productUrl: 'https://create.studio',
  companyName: 'Create Studio',
})

// Brand colors (matching ConfirmEmail.vue)
const colors = {
  primary: '#e5a832',
  primaryContent: '#5c4d1e',
  secondary: '#3d5a6e',
  secondaryContent: '#fafafa',
  accent: '#5870ac',
  baseContent: '#2d2e33',
  cream: '#faf8f5',
  warmWhite: '#fffdf9',
  success: '#16a34a',
  info: '#2563eb',
  warning: '#d97706',
  error: '#dc2626',
}

const darkColors = {
  base100: '#3a3a3c',
  base200: '#444446',
  base300: '#555557',
  baseContent: '#efefef',
}

const logoUrl = `${props.productUrl}/img/logo/logo-solo.svg`

const responsiveStyles = `
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; padding: 16px !important; }
    .email-card { border-radius: 12px !important; }
    .email-content { padding: 28px 24px !important; }
    .email-header { padding: 24px 24px 16px !important; }
    .email-title { font-size: 26px !important; }
    .email-btn { padding: 14px 32px !important; font-size: 15px !important; }
    .email-card { border-radius: 12px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .email-body { background-color: ${darkColors.base100} !important; }
    .email-container { background-color: ${darkColors.base100} !important; }
    .email-card { background-color: ${darkColors.base200} !important; }
    .email-header { border-bottom-color: ${darkColors.base100} !important; }
    .email-content { color: ${darkColors.baseContent} !important; }
    .email-title { color: ${darkColors.baseContent} !important; }
    .email-text { color: ${darkColors.baseContent} !important; }
    .email-subtext { color: #b8b8b8 !important; }
    .product-name { color: ${darkColors.baseContent} !important; }
    .email-btn { box-shadow: none !important; }
  }
`
</script>

<template>
  <Preview>{{ product }} v{{ version }} — {{ title }}</Preview>
  <Html lang="en">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <Style>{{ responsiveStyles }}</Style>
    </Head>

    <Body class="email-body" :style="{
      margin: 0,
      padding: 0,
      backgroundColor: colors.cream,
      fontFamily: '\'DM Sans\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      WebkitTextSizeAdjust: '100%',
    }">
      <Container class="email-container" :style="{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '40px 20px',
        backgroundColor: colors.cream,
      }">
        <!-- Main email card -->
        <Container class="email-card" :style="{
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: colors.warmWhite,
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(36, 60, 74, 0.08)',
          overflow: 'hidden',
        }">
          <!-- Decorative top bar (inside card to avoid double border-radius) -->
          <Section class="brand-stripe" :style="{
            width: '100%',
            height: '6px',
            background: 'linear-gradient(115deg, #fff1be 28%, #ee87cb 70%, #b060ff 100%)',
          }" />
          <!-- Header with logo -->
          <Section class="email-header" :style="{
            padding: '32px 40px 20px',
            textAlign: 'center',
            borderBottom: `1px solid ${colors.cream}`,
          }">
            <Link :href="productUrl" :style="{ textDecoration: 'none', display: 'inline-block' }">
              <table role="presentation" :style="{ margin: '0 auto' }">
                <tbody>
                  <tr>
                    <td :style="{ paddingRight: '2px', verticalAlign: 'middle' }">
                      <Img :src="logoUrl" alt="Create" width="40" height="40" :style="{ display: 'block' }" />
                    </td>
                    <td :style="{ verticalAlign: 'middle' }">
                      <span class="product-name" :style="{
                        fontFamily: '\'Instrument Serif\', Georgia, serif',
                        fontSize: '26px',
                        fontWeight: 400,
                        color: colors.baseContent,
                        letterSpacing: '-0.5px',
                      }">{{ productName }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Link>
          </Section>

          <!-- Main content -->
          <Section class="email-content" :style="{ padding: '36px 40px' }">
            <!-- Version badge -->
            <Heading as="h1" :style="{
              margin: '0 0 6px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: colors.accent,
            }">
              {{ product }} v{{ version }}
            </Heading>

            <Heading as="h2" class="email-title" :style="{
              margin: '0 0 20px',
              fontFamily: '\'Instrument Serif\', Georgia, serif',
              fontSize: '30px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: colors.baseContent,
              lineHeight: 1.2,
            }">
              {{ title }}
            </Heading>

            <Text class="email-text" :style="{
              margin: '0 0 24px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: colors.baseContent,
            }">
              {{ description }}
            </Text>

            <!-- Hero image -->
            <Img v-if="heroImageUrl" :src="heroImageUrl" :alt="title" :style="{
              display: 'block',
              width: '100%',
              maxWidth: '480px',
              height: 'auto',
              margin: '0 auto 24px',
              borderRadius: '8px',
            }" />

            <!-- Highlights -->
            <div v-for="(h, i) in highlights" :key="i" :style="{ marginBottom: '28px' }">
              <Heading as="h3" :style="{
                margin: '0 0 12px',
                fontFamily: '\'DM Sans\', sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: colors.baseContent,
                lineHeight: 1.3,
              }">
                {{ h.title }}
              </Heading>

              <Img v-if="h.imageUrl" :src="h.imageUrl" :alt="h.title" :style="{
                display: 'block',
                width: '100%',
                height: 'auto',
                marginBottom: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.cream}`,
              }" />

              <Text v-if="h.description" :style="{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.7,
                color: colors.baseContent,
              }">
                {{ h.description }}
              </Text>
            </div>

            <!-- CTA Button -->
            <Section :style="{ textAlign: 'center', margin: '28px 0' }">
              <Button class="email-btn" :href="releaseUrl" :style="{
                display: 'inline-block',
                padding: '16px 36px',
                backgroundColor: colors.primary,
                color: colors.primaryContent,
                fontFamily: '\'DM Sans\', sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: '50px',
                boxShadow: '0 4px 16px rgba(233, 168, 49, 0.35)',
              }">
                Read Full Release Notes →
              </Button>
            </Section>

            <!-- Divider -->
            <table role="presentation" :style="{ width: '100%', margin: '20px 0' }">
              <tbody>
                <tr>
                  <td :style="{ width: '30%', height: '1px', backgroundColor: colors.cream }" />
                  <td :style="{ width: '40%', textAlign: 'center', padding: '0 12px' }">
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#fff1be', borderRadius: '50%', marginRight: '8px' }" />
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#ee87cb', borderRadius: '50%', marginRight: '8px' }" />
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#b060ff', borderRadius: '50%' }" />
                  </td>
                  <td :style="{ width: '30%', height: '1px', backgroundColor: colors.cream }" />
                </tr>
              </tbody>
            </table>

            <Text class="email-text" :style="{
              margin: '20px 0 0',
              fontSize: '14px',
              lineHeight: 1.6,
              color: colors.baseContent,
            }">
              Cheers,<br />
              <span :style="{ fontStyle: 'italic' }">The Create Team</span>
            </Text>
          </Section>
        </Container>

        <!-- Bottom footer -->
        <Section :style="{
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          padding: '28px 20px',
          textAlign: 'center',
        }">
          <Text class="email-subtext" :style="{
            margin: '0 0 6px',
            fontSize: '12px',
            color: colors.baseContent,
          }">
            © {{ year }} {{ productName }}. Made with care.
          </Text>
          <Text v-if="companyName" class="email-subtext" :style="{
            margin: '0 0 10px',
            fontSize: '11px',
            color: colors.baseContent,
          }">
            {{ companyName }}
          </Text>
          <Link :href="unsubscribeUrl" :style="{
            fontSize: '11px',
            color: colors.accent,
            textDecoration: 'underline',
          }">
            Unsubscribe from release notes
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
</template>
