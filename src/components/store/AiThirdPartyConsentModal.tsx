'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

type Props = {
  open: boolean
  saving?: boolean
  onClose: () => void
  onAgree: () => void
}

export function AiThirdPartyConsentModal({ open, saving, onClose, onAgree }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Third-party AI consent"
      subtitle="Required before enabling Chat Boat"
      footer={
        <div className="flex flex-col gap-2">
          <Button label="I agree — enable Chat Boat" loading={saving} onClick={onAgree} />
          <Button label="Not now" variant="outline" onClick={onClose} disabled={saving} />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="leading-6 text-gray-700">
          Chat Boat uses third-party AI services to draft automatic replies to your customers on
          WhatsApp and Instagram.
        </p>

        <p className="text-sm leading-5 text-gray-500">
          Data that may be sent to these providers includes:
        </p>
        <div className="flex flex-col gap-1.5">
          {[
            'Customer messages and conversation history from connected inboxes',
            'Your product catalog, store name, and storefront links',
            'Custom instructions you add in Chat Boat settings',
          ].map((item) => (
            <p key={item} className="text-sm leading-5 text-gray-500">
              • {item}
            </p>
          ))}
        </div>

        <p className="text-sm leading-5 text-gray-500">
          Providers: OpenAI (gpt-4o-mini) and/or TokenBee (OpenAIGPT4oMini / OpenAI gpt-4o-mini, as
          configured by AiShopy). They process this data only to generate reply text for your store.
          You can turn off Chat Boat or take over any chat manually at any time.
        </p>

        <p className="text-xs leading-5 text-gray-500">
          We use OpenAI&apos;s API, which does not use your data to train their models by default.
        </p>

        <p className="text-xs leading-5 text-gray-500">
          By tapping “I agree”, you consent to this third-party AI processing. See our Privacy Policy
          for more detail.
        </p>
      </div>
    </Modal>
  )
}
