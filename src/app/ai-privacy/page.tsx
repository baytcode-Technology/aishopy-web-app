import { LegalScreen, LegalSection } from '@/components/legal/LegalScreen'
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/core/lib/support-contact'
import Link from 'next/link'

const DATA_SENT = [
  'Customer messages and conversation history from connected WhatsApp and Instagram inboxes',
  'Your product catalog, store name, and storefront links',
  'Custom instructions you add in Chat Boat settings',
]

export default function AiPrivacyPage() {
  return (
    <LegalScreen
      title="AI & data privacy"
      subtitle="What Chat Boat shares with AI providers"
      lastUpdated="3 Sep 2026"
    >
      <LegalSection title="When this applies">
        Chat Boat is optional. Data is sent to a third-party AI provider only after you enable Chat
        Boat and agree to the in-app consent screen. If Chat Boat is off, we do not send customer
        messages to those providers for auto-replies.
      </LegalSection>
      <LegalSection title="What data is sent">
        When Chat Boat is enabled, the following may be sent to generate a reply:
      </LegalSection>
      <ul className="-mt-4 mb-6 list-disc space-y-1 pl-5 text-sm leading-5 text-gray-500">
        {DATA_SENT.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <LegalSection title="Who receives the data">
        Providers: OpenAI (gpt-4o-mini) and/or TokenBee (OpenAIGPT4oMini / OpenAI gpt-4o-mini, as
        configured by AiShopy). They process this data only to generate reply text for your store.
      </LegalSection>
      <LegalSection title="Your permission and controls">
        We ask for your explicit permission in the app before enabling Chat Boat. You can turn Chat
        Boat off at any time, or take over any chat manually from the inbox. You can also delete
        your account from Settings → Delete account.
      </LegalSection>
      <LegalSection title="Training behavior">
        We use OpenAI&apos;s API, which does not use your data to train their models by default.
      </LegalSection>
      <LegalSection title="Privacy policy">
        Our Privacy Policy describes what we collect, how we use it, and which third parties process
        data on our behalf.
      </LegalSection>
      <Link href="/privacy" className="font-semibold text-ink underline">
        Read the Privacy Policy
      </Link>
      <p className="mt-4 text-xs leading-5 text-gray-500">
        Website copy: {PRIVACY_POLICY_URL}. Questions: {SUPPORT_EMAIL}.
      </p>
    </LegalScreen>
  )
}
