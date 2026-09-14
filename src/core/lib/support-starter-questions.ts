export const SUPPORT_STARTER_QUESTIONS = [
  'How do I add a product?',
  'How do I create a category?',
  'How do I connect WhatsApp?',
  'How do I manage orders?',
  'What plan do I need for chats?',
  'How do I set up payments?',
] as const

export type SupportStarterQuestion = (typeof SUPPORT_STARTER_QUESTIONS)[number]
