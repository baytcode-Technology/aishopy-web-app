export function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">or</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}
