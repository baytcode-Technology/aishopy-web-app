import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/Input'

export function AuthInput(props: ComponentProps<typeof Input>) {
  return <Input {...props} />
}
