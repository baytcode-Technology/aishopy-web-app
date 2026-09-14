import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/Button'

export function AuthButton(props: ComponentProps<typeof Button>) {
  return <Button {...props} />
}
