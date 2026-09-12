import { LegalScreen, LegalSection } from '@/components/legal/LegalScreen'
import { SUPPORT_EMAIL } from '@/core/lib/support-contact'

export default function TermsPage() {
  return (
    <LegalScreen title="Terms" subtitle="Using AiShopy" lastUpdated="17 Aug 2026">
      <LegalSection title="Using the service">
        By creating an account or using AiShopy, you agree to these terms. You must provide accurate
        account details and keep your login secure. You are responsible for activity on your store
        and staff accounts.
      </LegalSection>
      <LegalSection title="Acceptable use">
        Do not misuse the service, attempt to access other accounts, send spam or illegal content,
        or use AiShopy in a way that violates WhatsApp, Instagram, payment-provider, or other
        third-party rules. We may suspend accounts that harm customers, merchants, or the platform.
      </LegalSection>
      <LegalSection title="Customer and order data">
        You own the catalog, customer, and order data you put into AiShopy. You must have the right
        to collect and use that data. We process it only to provide the service.
      </LegalSection>
      <LegalSection title="Third-party services and payments">
        WhatsApp, Instagram, Razorpay, and similar providers are separate services. Their fees,
        availability, and policies apply in addition to these terms. AiShopy is not responsible for
        outages or decisions made by those providers.
      </LegalSection>
      <LegalSection title="Subscriptions and availability">
        Paid plans, trials, and usage limits are described in the app. We may change pricing or
        features with notice where required. The service is provided as available; we do not
        guarantee uninterrupted uptime.
      </LegalSection>
      <LegalSection title="Intellectual property">
        AiShopy and its branding, software, and documentation remain our property. You keep rights
        to your store content. You grant us a limited license to host and display that content so
        the service can work.
      </LegalSection>
      <LegalSection title="Disclaimers and liability">
        The service is provided “as is.” To the fullest extent allowed by law, AiShopy is not liable
        for lost profits, lost data, or indirect damages arising from your use of the app, storefront,
        or connected third-party services.
      </LegalSection>
      <LegalSection title="Changes and contact">
        We may update these terms. Continued use after an update means you accept the revised terms.
        Questions: {SUPPORT_EMAIL}.
      </LegalSection>
      <p className="text-sm leading-6 text-gray-600">Contact us at {SUPPORT_EMAIL}.</p>
    </LegalScreen>
  )
}
