import Image from 'next/image'
import Link from 'next/link'

type Props = {
  variant?: 'wordmark' | 'mark'
  href?: string | null
}

export function AppLogo({ variant = 'wordmark', href = '/' }: Props) {
  const isWordmark = variant === 'wordmark'
  const image = (
    <Image
      src={isWordmark ? '/aishopy_logo.png' : '/app_logo.jpg'}
      alt="AiShopy"
      width={isWordmark ? 138 : 40}
      height={isWordmark ? 18 : 40}
      className={isWordmark ? 'h-[18px] w-[138px] object-contain' : 'h-10 w-10 rounded-lg object-cover'}
      priority
    />
  )

  if (href == null || href === '') return image
  return (
    <Link href={href} className="inline-flex items-center justify-center">
      {image}
    </Link>
  )
}
