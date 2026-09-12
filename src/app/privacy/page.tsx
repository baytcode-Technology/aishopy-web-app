import { LegalScreen, LegalSection } from '@/components/legal/LegalScreen'
import { SUPPORT_EMAIL } from '@/core/lib/support-contact'

export default function PrivacyPage() {
  return (
    <LegalScreen title="Privacy policy" subtitle="How we handle your data" lastUpdated="3 Sep 2026">
      <LegalSection title="Who this applies to">
        This policy describes how AiShopy collects and uses information when you use our merchant
        app, storefront, and related services. If you have questions, email {SUPPORT_EMAIL}.
      </LegalSection>
      <LegalSection title="Information we collect">
        Account details such as your name, email, and sign-in identifiers. Store details such as
        store name, branding, catalog, and settings. Customer and order information you add or that
        customers submit on your storefront. Messaging data from connected WhatsApp or Instagram
        inboxes. Device and usage information needed to operate and improve the app.
      </LegalSection>
      <LegalSection title="How we use information">
        We use this information to provide your store, process orders, send notifications, support
        chat and inbox features, improve the product, and keep accounts secure. We do not sell your
        personal information.
      </LegalSection>
      <LegalSection title="Chat Boat and third-party AI">
        If you enable Chat Boat, customer messages, conversation history, your product catalog,
        store details, and any custom instructions you provide may be sent to third-party AI
        providers (OpenAI and/or TokenBee, using gpt-4o-mini) to generate automatic replies. We
        ask for your explicit consent in the app before enabling this feature. We use OpenAI&apos;s
        API, which does not use your data to train their models by default. You can turn off
        Chat Boat or take over any chat manually at any time.
      </LegalSection>
      <LegalSection title="Service Providers We Use">
        Service providers we use include Supabase (hosting/database), Expo (push notifications),
        Razorpay (payments), RevenueCat (subscription billing), OpenAI and/or TokenBee (Chat Boat
        reply generation using gpt-4o-mini), and Meta Platforms (WhatsApp/Instagram messaging).
      </LegalSection>
      <LegalSection title="WhatsApp, Instagram, and payments">
        If you connect WhatsApp, Instagram, or a payment provider, those services process related
        data under their own terms. We only use that data to run the features you enable, such as
        inbox, catalog sharing, and checkout.
      </LegalSection>
      <LegalSection title="Sharing, retention, and security">
        We share information with service providers who help us host, send messages, process
        payments, or support the app. We keep information while your account is active. When you
        delete your account, we delete your stores and associated data as part of the account
        deletion request. Some information may be retained for legal, tax, or fraud-prevention
        purposes. We use reasonable safeguards, but no method of transmission or storage is
        completely secure.
      </LegalSection>
      <LegalSection title="Your responsibilities">
        You are responsible for the customer data you collect through your store, including getting
        any consents required for WhatsApp, marketing, or checkout. Do not use AiShopy to process
        information you are not allowed to collect.
      </LegalSection>
      <LegalSection title="Your choices">
        You can update store and account details in the app. You can delete your account from
        Settings → Delete account; this permanently removes your account and any stores you own.
        You may also email {SUPPORT_EMAIL} for access or correction requests. We may need to keep
        some records for legal or billing reasons.
      </LegalSection>
      <LegalSection title="Your Rights">
        Depending on where you live, you may have rights to access, correct, delete, or export
        your personal data. To exercise these rights, email {SUPPORT_EMAIL}.
      </LegalSection>
      <LegalSection title="Children&apos;s Privacy">
        AiShopy is not directed to children under 13 (or the minimum age required in your region),
        and we do not knowingly collect personal information from children.
      </LegalSection>
      <LegalSection title="Changes to This Policy">
        If we make material changes to this policy, we will notify you in the app before the
        changes take effect.
      </LegalSection>
      <p className="text-sm leading-6 text-gray-600">
        Contact us at {SUPPORT_EMAIL} for privacy requests or questions.
      </p>
    </LegalScreen>
  )
}
