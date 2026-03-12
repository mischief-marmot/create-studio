import { render } from '@vue-email/render'
import Create2UpgradeEmail from '../../components/emails/Create2UpgradeEmail.vue'

export default defineEventHandler(async () => {
  const html = await render(Create2UpgradeEmail, {
    productName: 'Create Studio',
    productUrl: 'https://cs.test',
    companyName: 'Mischief Marmot LLC',
    unsubscribeUrl: '#',
  }, { pretty: true })

  return html
})
