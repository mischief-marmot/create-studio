<script setup lang="ts">
import { Html, Head, Body, Container, Section, Heading, Text, Button, Link, Preview, Img, Style } from '@vue-email/components'

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

// Brand colors from Create Studio design system (converted from oklch)
const colors = {
  // Primary - Honey Gold
  primary: '#e5a832',           // oklch(0.8647 0.1557 86.553)
  primaryContent: '#5c4d1e',    // oklch(0.4071 0.1055 94.61) - dark brown text on gold

  // Secondary - Deep Navy
  secondary: '#3d5a6e',         // oklch(0.456 0.0462 235.11)
  secondaryContent: '#fafafa',  // oklch(98% 0 0)

  // Accent - Sky Blue
  accent: '#5870ac',            // oklch(0.68 0.1207 267.2)

  // Base colors (light theme)
  baseContent: '#2d2e33',       // oklch(0.21 0.006 285.885) - main text

  // Other brand colors
  plum: '#5f3553',
  purple: '#827a9f',

  // Email-specific
  cream: '#faf8f5',
  warmWhite: '#fffdf9',
}

// Use the product URL to construct the logo path
const logoUrl = `${props.productUrl}/img/logo/logo-solo.svg`

// Dark mode base colors (from main.css dark theme)
const darkColors = {
  base100: '#3a3a3c',           // oklch(0.2282 0.0018 98.5) - dark background
  base200: '#444446',           // oklch(0.2685 0.0035 106.6)
  base300: '#555557',           // oklch(0.3086 0.0042 123.7)
  baseContent: '#efefef',       // oklch(94% 0.002 247.839) - light text
}

const responsiveStyles = `
  /* Mobile responsive */
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; padding: 16px !important; }
    .email-card { border-radius: 12px !important; }
    .email-content { padding: 28px 24px !important; }
    .email-header { padding: 24px 24px 16px !important; }
    .email-footer-help { padding: 20px 24px !important; }
    .email-title { font-size: 26px !important; }
    .email-btn { padding: 14px 32px !important; font-size: 15px !important; }
    .brand-stripe { border-radius: 12px 12px 0 0 !important; }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .email-body { background-color: ${darkColors.base100} !important; }
    .email-container { background-color: ${darkColors.base100} !important; }
    .email-card { background-color: ${darkColors.base200} !important; }
    .email-header { border-bottom-color: ${darkColors.base100} !important; }
    .email-content { color: ${darkColors.baseContent} !important; }
    .email-footer-help { background-color: ${darkColors.base300} !important; color: #c8c8c8 !important; }
    .email-title { color: ${darkColors.baseContent} !important; }
    .email-text { color: ${darkColors.baseContent} !important; }
    .email-subtext { color: #b8b8b8 !important; }
    .product-name { color: ${darkColors.baseContent} !important; }
    .email-divider { background-color: #555 !important; }
    .email-btn { box-shadow: none !important; }
  }
`
</script>

<template>
  <Preview>Verify your email to unlock Create Studio</Preview>
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

        <!-- Decorative top bar - matches AbsoluteGradient component -->
        <Section class="brand-stripe" :style="{
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          height: '6px',
          background: 'linear-gradient(115deg, #fff1be 28%, #ee87cb 70%, #b060ff 100%)',
          borderRadius: '16px 16px 0 0',
        }" />

        <!-- Main email card -->
        <Container class="email-card" :style="{
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: colors.warmWhite,
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 4px 24px rgba(36, 60, 74, 0.08)',
          overflow: 'hidden',
        }">

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
            <!-- Greeting with subtle accent -->
            <Heading as="h1" :style="{
              margin: '0 0 6px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: colors.accent,
            }">
              Welcome aboard
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
              Hey {{ name }}!
            </Heading>

            <Text class="email-text" :style="{
              margin: '0 0 24px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: colors.baseContent,
            }">
              You're just one click away from unlocking the full power of Create.
              Verify your email address to start crafting beautiful recipe cards,
              how-to guides, and structured content that stands out.
            </Text>

            <!-- CTA Button -->
            <Section :style="{
              textAlign: 'center',
              margin: '28px 0',
            }">
              <Button class="email-btn" :href="actionUrl" :style="{
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
                Verify My Email →
              </Button>
            </Section>

            <!-- Decorative divider - matches AbsoluteGradient colors -->
            <table role="presentation" :style="{ width: '100%', margin: '20px 0' }">
              <tbody>
                <tr>
                  <td class="email-divider" :style="{ width: '30%', height: '1px', backgroundColor: colors.cream }" />
                  <td :style="{ width: '40%', textAlign: 'center', padding: '0 12px' }">
                    <span :style="{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#fff1be',
                      borderRadius: '50%',
                      marginRight: '8px',
                    }" />
                    <span :style="{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#ee87cb',
                      borderRadius: '50%',
                      marginRight: '8px',
                    }" />
                    <span :style="{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#b060ff',
                      borderRadius: '50%',
                    }" />
                  </td>
                  <td class="email-divider" :style="{ width: '30%', height: '1px', backgroundColor: colors.cream }" />
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

          <!-- Footer help section -->
          <Section class="email-footer-help" :style="{
            padding: '20px 40px',
            backgroundColor: colors.cream,
            borderTop: `1px solid rgba(36, 60, 74, 0.06)`,
          }">
            <Text class="email-subtext" :style="{
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.6,
              color: colors.baseContent,
            }">
              Having trouble with the button? Copy and paste this link into your browser:
            </Text>
            <Text :style="{
              margin: '6px 0 0',
              fontSize: '11px',
              lineHeight: 1.5,
              color: colors.accent,
              wordBreak: 'break-all',
            }">
              {{ actionUrl }}
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
          <Text v-if="companyName || supportEmail" class="email-subtext" :style="{
            margin: 0,
            fontSize: '11px',
            color: colors.baseContent,
          }">
            <span v-if="companyName">{{ companyName }}</span>
            <span v-if="companyName && supportEmail"> · </span>
            <Link v-if="supportEmail" :href="'mailto:' + supportEmail" :style="{ color: colors.accent, textDecoration: 'none' }">
              {{ supportEmail }}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
</template>
