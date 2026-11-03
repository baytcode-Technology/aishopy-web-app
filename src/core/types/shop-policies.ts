export type ShopPolicies = {
  has_physical_store: boolean
  address: string | null
  hours: string | null
  default_delivery_business_days: number | null
  delivery_fee: number | null
  free_delivery_above: number | null
  same_day_delivery: boolean
  next_day_delivery: boolean
  service_area: string | null
  return_days: number | null
  exchange_allowed: boolean
  refund_days_after_cancel: number | null
  return_note: string | null
  current_offer_note: string | null
  pickup_note: string | null
}

export const EMPTY_SHOP_POLICIES: ShopPolicies = {
  has_physical_store: false,
  address: null,
  hours: null,
  default_delivery_business_days: null,
  delivery_fee: null,
  free_delivery_above: null,
  same_day_delivery: false,
  next_day_delivery: false,
  service_area: null,
  return_days: null,
  exchange_allowed: false,
  refund_days_after_cancel: null,
  return_note: null,
  current_offer_note: null,
  pickup_note: null,
}

export function parseShopPolicies(raw: unknown): ShopPolicies {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY_SHOP_POLICIES }
  const record = raw as Record<string, unknown>
  const num = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : typeof value === 'string' && value.trim() && Number.isFinite(Number(value))
        ? Number(value)
        : null
  const str = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : null
  return {
    has_physical_store: record.has_physical_store === true,
    address: str(record.address),
    hours: str(record.hours),
    default_delivery_business_days: num(record.default_delivery_business_days),
    delivery_fee: num(record.delivery_fee),
    free_delivery_above: num(record.free_delivery_above),
    same_day_delivery: record.same_day_delivery === true,
    next_day_delivery: record.next_day_delivery === true,
    service_area: str(record.service_area),
    return_days: num(record.return_days),
    exchange_allowed: record.exchange_allowed === true,
    refund_days_after_cancel: num(record.refund_days_after_cancel),
    return_note: str(record.return_note),
    current_offer_note: str(record.current_offer_note),
    pickup_note: str(record.pickup_note),
  }
}
