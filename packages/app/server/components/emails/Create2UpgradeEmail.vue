<script setup lang="ts">
import { Html, Head, Body, Container, Section, Heading, Text, Button, Link, Preview, Img, Style } from '@vue-email/components'

interface Props {
  productName?: string
  productUrl?: string
  companyName?: string
  unsubscribeUrl?: string
}

const year = new Date().getFullYear()

const props = withDefaults(defineProps<Props>(), {
  productName: 'Create Studio',
  productUrl: 'https://create.studio',
  companyName: 'Mischief Marmot LLC',
  unsubscribeUrl: '#',
})

// Colors derived from main.css theme
const colors = {
  // Primary - Deep Navy
  primary: '#3d5b6d',
  primaryContent: '#fafafa',
  // Accent - Honey Gold
  accent: '#e5a832',
  accentContent: '#5c4d1e',
  // Base (light theme)
  base100: '#fbf8f6',  // oklch(0.9891 0.0074 284.27)
  base200: '#f5f0ec',  // oklch(0.9743 0.0103 284.27)
  base300: '#eee8e3',  // oklch(0.9573 0.0111 284.27)
  baseContent: '#1a1a1f', // oklch(0.21 0.006 284.27)
  // Info - Soft Purple
  info: '#7c6cae',
}

const darkColors = {
  base100: '#37373a',  // oklch(0.2242 0.0021 284.27)
  base200: '#434346',  // oklch(0.2685 0.0035 284.27)
  base300: '#545457',  // oklch(0.3332 0.0067 284.27)
  baseContent: '#efefef',
}

const logoUrl = `${props.productUrl}/img/logo/logo-solo.svg`
const imgBase = `${props.productUrl}/img/emails`

const responsiveStyles = `
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; padding: 16px !important; }
    .email-card { border-radius: 12px !important; }
    .email-content { padding: 28px 24px !important; }
    .email-header { padding: 24px 24px 16px !important; }
    .email-title { font-size: 26px !important; }
    .email-btn { padding: 14px 32px !important; font-size: 15px !important; }
    .feature-img { border-radius: 6px !important; }
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
    .feature-title { color: ${darkColors.baseContent} !important; }
    .feature-desc { color: #c8c8c8 !important; }
    .pro-box { background-color: ${darkColors.base300} !important; border-color: ${darkColors.base100} !important; }
    .pro-label { color: #a78bfa !important; }
    .pro-title { color: ${darkColors.baseContent} !important; }
    .pro-text { color: #c8c8c8 !important; }
  }
`
</script>

<template>
  <Preview>Create 2.0 is here: Interactive Mode, adjustable servings, new themes &amp; more</Preview>
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
      backgroundColor: colors.base100,
      fontFamily: '\'DM Sans\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      WebkitTextSizeAdjust: '100%',
    }">
      <Container class="email-container" :style="{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '40px 20px',
        backgroundColor: colors.base100,
      }">
        <!-- Main email card -->
        <Container class="email-card" :style="{
          width: '100%',
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(36, 60, 74, 0.08)',
          overflow: 'hidden',
        }">
          <!-- Decorative top bar -->
          <Section class="brand-stripe" :style="{
            width: '100%',
            height: '6px',
            background: 'linear-gradient(115deg, #fff1be 28%, #ee87cb 70%, #b060ff 100%)',
          }" />

          <!-- Header with logo -->
          <Section class="email-header" :style="{
            padding: '32px 40px 20px',
            textAlign: 'center',
            borderBottom: `1px solid ${colors.base200}`,
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
              color: colors.info,
            }">
              Major Update
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
              Create 2.0 is Here
            </Heading>

            <Text class="email-text" :style="{
              margin: '0 0 32px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: colors.baseContent,
            }">
              Create 2.0 is a complete reimagining of the WordPress plugin you know and love. A redesigned editor, powerful new features, better performance, and a stunning new way for your readers to experience your content. It's stable, it's fast, and it's ready for you.
            </Text>

            <!-- Feature: Interactive Mode -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Interactive Mode
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 28px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              A mobile-first experience with built-in timers, step-by-step navigation, ingredient checklists, and automatic progress saving. Your readers will love it.
            </Text>

            <!-- Feature: Servings & Conversion -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Adjustable Servings &amp; Unit Conversion
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 16px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              Readers can scale ingredient quantities and convert between US and metric measurements with a single tap. No page reload required.
            </Text>
            <Img :src="`${imgBase}/widget-toolbar.gif`" alt="Adjustable servings and unit conversion toolbar" class="feature-img" :style="{
              display: 'block',
              width: '100%',
              height: 'auto',
              marginBottom: '28px',
              borderRadius: '8px',
              border: `1px solid ${colors.base200}`,
            }" />

            <!-- Feature: Redesigned Editor & Settings -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Redesigned Editor &amp; Settings
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 16px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              Collapsible sections, split-pane layout, granular ingredient editing, sticky toolbar, searchable settings with live theme preview, and keyboard shortcuts throughout.
            </Text>
            <Img :src="`${imgBase}/settings.gif`" alt="Redesigned searchable settings with live theme preview" class="feature-img" :style="{
              display: 'block',
              width: '100%',
              height: 'auto',
              marginBottom: '28px',
              borderRadius: '8px',
              border: `1px solid ${colors.base200}`,
            }" />

            <!-- Feature: Importers -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Built-In Recipe Importers
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 28px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              Import from WP Recipe Maker, Tasty Recipes, EasyRecipe, and 8+ other plugins. Built right in, no separate download needed.
            </Text>

            <!-- Feature: Dashboard & Achievements -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Dashboard, Achievements, &amp; Confetti!
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 28px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              A brand new home base with customizable widgets, stats, and tips. Earn milestones as you create cards and collect reviews. And yes, there's confetti.
            </Text>
            <Img :src="`${imgBase}/dashboard.gif`" alt="New dashboard with achievements and confetti" class="feature-img" :style="{
              display: 'block',
              width: '100%',
              height: 'auto',
              marginBottom: '28px',
              borderRadius: '8px',
              border: `1px solid ${colors.base200}`,
            }" />

            <!-- Feature: Performance -->
            <Heading as="h3" class="feature-title" :style="{
              margin: '0 0 8px',
              fontFamily: '\'DM Sans\', sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: colors.baseContent,
              lineHeight: 1.3,
            }">
              Performance &amp; Accessibility
            </Heading>
            <Text class="feature-desc" :style="{
              margin: '0 0 32px',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#555',
            }">
              Optimized JavaScript bundling for faster loading, tiny 2.8MB plugin footprint, and improved text contrast across all card layouts to meet WCAG standards.
            </Text>

            <!-- CTA: Update -->
            <Section :style="{ textAlign: 'center', margin: '0 0 28px' }">
              <Button class="email-btn" :href="`${productUrl}/releases/create-plugin-2-0-0`" :style="{
                display: 'inline-block',
                padding: '16px 36px',
                backgroundColor: colors.primary,
                color: colors.primaryContent,
                fontFamily: '\'DM Sans\', sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: '50px',
                boxShadow: '0 4px 16px rgba(61, 91, 109, 0.3)',
              }">
                See Everything New in 2.0
              </Button>
            </Section>

            <Text class="email-text" :style="{
              margin: '0 0 8px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#888',
              textAlign: 'center',
            }">
              Update from your WordPress dashboard under Plugins > Updates
            </Text>

            <!-- Divider -->
            <table role="presentation" :style="{ width: '100%', margin: '24px 0' }">
              <tbody>
                <tr>
                  <td :style="{ width: '30%', height: '1px', backgroundColor: colors.base200 }" />
                  <td :style="{ width: '40%', textAlign: 'center', padding: '0 12px' }">
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#fff1be', borderRadius: '50%', marginRight: '8px' }" />
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#ee87cb', borderRadius: '50%', marginRight: '8px' }" />
                    <span :style="{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#b060ff', borderRadius: '50%' }" />
                  </td>
                  <td :style="{ width: '30%', height: '1px', backgroundColor: colors.base200 }" />
                </tr>
              </tbody>
            </table>

            <!-- Pro trial callout -->
            <table role="presentation" class="pro-box" :style="{
              width: '100%',
              marginBottom: '24px',
              borderRadius: '12px',
              overflow: 'hidden',
            }">
              <tbody>
                <!-- Gradient accent bar -->
                <tr>
                  <td :style="{
                    height: '4px',
                    background: 'linear-gradient(115deg, #fff1be 28%, #ee87cb 70%, #b060ff 100%)',
                  }" />
                </tr>
                <tr>
                  <td :style="{
                    padding: '24px',
                    backgroundColor: '#faf5ff',
                    border: '1px solid #e8dcf5',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                  }">
                    <table role="presentation" :style="{ width: '100%' }">
                      <tbody>
                        <tr>
                          <td>
                            <Text class="pro-label" :style="{
                              margin: '0 0 4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '1.2px',
                              color: '#8b5cf6',
                            }">
                              Create Pro
                            </Text>
                            <Text class="pro-title" :style="{
                              margin: '0 0 12px',
                              fontFamily: '\'Instrument Serif\', Georgia, serif',
                              fontSize: '22px',
                              fontWeight: 400,
                              fontStyle: 'italic',
                              color: colors.baseContent,
                              lineHeight: 1.2,
                            }">
                              Try every Pro feature free for 14 days
                            </Text>
                            <Text class="pro-text" :style="{
                              margin: '0 0 18px',
                              fontSize: '14px',
                              lineHeight: 1.6,
                              color: '#555',
                            }">
                              Interactive Mode, adjustable servings, unit conversion, premium themes, interactive checklists, and review management. No credit card required.
                            </Text>
                            <table role="presentation">
                              <tbody>
                                <tr>
                                  <td>
                                    <Link :href="`${productUrl}/auth/login?email={{EmailAddress}}&redirect=/admin/upgrade`" :style="{
                                      display: 'inline-block',
                                      padding: '10px 24px',
                                      backgroundColor: '#8b5cf6',
                                      color: '#ffffff',
                                      fontFamily: '\'DM Sans\', sans-serif',
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      borderRadius: '50px',
                                    }">
                                      Start Your Free Trial
                                    </Link>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <Text class="email-text" :style="{
              margin: '0',
              fontSize: '14px',
              lineHeight: 1.6,
              color: colors.baseContent,
            }">
              Cheers,<br />
              <span :style="{ fontStyle: 'italic' }">JM &amp; The Create Team</span>
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
            Copyright {{ year }} {{ productName }}. Made with care.
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
            color: colors.info,
            textDecoration: 'underline',
          }">
            Unsubscribe from release emails
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
</template>
