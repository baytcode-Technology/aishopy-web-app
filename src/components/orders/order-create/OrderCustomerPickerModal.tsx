'use client'

import { Modal } from '@/components/ui/Modal'
import { fetchCustomers } from '@/core/api/customers'
import { getErrorMessage } from '@/core/lib/api-error'
import { customerDisplayName, customerDisplayPhone } from '@/core/lib/customer-display'
import type { Customer } from '@/core/types/customer'
import { useEffect, useMemo, useState } from 'react'
import { OrderNewCustomerModal } from './OrderNewCustomerModal'
import { OrderSearchBar } from './OrderSearchBar'

type Props = {
  open: boolean
  storeId: number
  selectedCustomerId: number | null
  onClose: () => void
  onSelectCustomer: (customer: Customer) => void
}

export function OrderCustomerPickerModal({
  open,
  storeId,
  selectedCustomerId,
  onClose,
  onSelectCustomer,
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !storeId) return
    setLoading(true)
    setError('')
    fetchCustomers(storeId)
      .then((res) => setCustomers(res.data.customers))
      .catch((e) => setError(getErrorMessage(e, 'Could not load customers')))
      .finally(() => setLoading(false))
  }, [open, storeId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const name = c.name?.toLowerCase() ?? ''
      const email = c.email?.toLowerCase() ?? ''
      const phone = customerDisplayPhone(c)?.toLowerCase() ?? ''
      return name.includes(q) || email.includes(q) || phone.includes(q)
    })
  }, [customers, search])

  const handleCreated = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev])
    onSelectCustomer(customer)
    onClose()
  }

  return (
    <>
      <Modal open={open && !newOpen} title="Customer" onClose={onClose}>
        <div className="flex flex-col gap-3">
          <OrderSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone, or email"
          />

          <button
            type="button"
            className="flex items-center gap-3 py-3 text-left"
            onClick={() => setNewOpen(true)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[14px] font-bold text-[#2563EB]">
              +
            </span>
            <span className="text-[15px] font-semibold text-ink">Add new customer</span>
          </button>

          {error ? <p className="text-[13px] font-medium text-[#E11D48]">{error}</p> : null}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {customers.length > 0 ? 'Customers' : 'No customers yet'}
              </p>
              <div className="max-h-[360px] overflow-y-auto">
                {filtered.map((customer) => {
                  const phone = customerDisplayPhone(customer)
                  const selected = selectedCustomerId === customer.id
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      className={`mb-2 w-full rounded-2xl border px-4 py-3.5 text-left ${
                        selected ? 'border-ink bg-gray-50' : 'border-gray-200 bg-gray-50/60'
                      }`}
                      onClick={() => {
                        onSelectCustomer(customer)
                        onClose()
                      }}
                    >
                      <p className="text-[15px] font-semibold text-ink">{customerDisplayName(customer)}</p>
                      {phone ? (
                        <p className="mt-0.5 text-[13px] text-gray-500">{phone}</p>
                      ) : customer.email ? (
                        <p className="mt-0.5 text-[13px] text-gray-500">{customer.email}</p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Modal>

      <OrderNewCustomerModal
        open={newOpen}
        storeId={storeId}
        onClose={() => setNewOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
