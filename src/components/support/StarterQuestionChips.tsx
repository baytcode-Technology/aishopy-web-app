'use client'

import { SUPPORT_STARTER_QUESTIONS } from '@/core/lib/support-starter-questions'

type Props = {
  onSelect: (question: string) => void
  disabled?: boolean
}

export function StarterQuestionChips({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-1 pt-2">
      <p className="px-1 text-[13px] text-gray-500">Quick questions</p>
      <div className="flex gap-2 overflow-x-auto px-1">
        {SUPPORT_STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="shrink-0 rounded-full border border-brand-green/30 bg-[#E8F8EC] px-3.5 py-2 text-[13px] font-medium text-brand-green"
            style={{ opacity: disabled ? 0.6 : 1 }}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
