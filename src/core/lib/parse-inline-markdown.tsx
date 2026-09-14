type Segment = { text: string; bold: boolean }

export function parseBoldMarkdown(text: string): Segment[] {
  const segments: Segment[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false })
    }
    segments.push({ text: match[1], bold: true })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false })
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false })
  }

  return segments
}

type FormattedMessageTextProps = {
  text: string
  className?: string
  boldClassName?: string
}

/** Renders `**bold**` as bold text without showing asterisks. */
export function FormattedMessageText({
  text,
  className,
  boldClassName = 'font-bold',
}: FormattedMessageTextProps) {
  const segments = parseBoldMarkdown(text)

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.bold ? (
          <strong key={index} className={boldClassName}>
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  )
}
