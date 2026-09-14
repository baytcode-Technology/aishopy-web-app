'use client'

import { OrderCartLine } from '@/components/orders/order-create/OrderCartLine'
import { OrderCustomerPickerModal } from '@/components/orders/order-create/OrderCustomerPickerModal'
import { OrderProductPickerBody } from '@/components/orders/order-create/OrderProductPickerBody'
import { OrderVariantPickerBody } from '@/components/orders/order-create/OrderVariantPickerBody'
import {
  cartLineKey,
  type CartLine,
  unitPrice,
} from '@/components/orders/order-create/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { createOrder } from '@/core/api/orders'
import { fetchProduct, fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { customerDisplayName, customerDisplayPhone } from '@/core/lib/customer-display'
import { formatMoney } from '@/core/lib/format-money'
import { getProductStatus } from '@/core/lib/product-status'
import type { Customer } from '@/core/types/customer'
import type { Product, ProductVariant } from '@/core/types/product'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  storeId: number
  currency?: string
  onClose: () => void
  onCreated: () => void
}

type OrderModalStep = 'cart' | 'products' | 'variants'

export function CreateOrderModal({ open, storeId, currency, onClose, onCreated }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const [step, setStep] = useState<OrderModalStep>('cart')
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingVariants, setPendingVariants] = useState<ProductVariant[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)

  useEffect(() => {
    if (!open || !storeId) return
    setProductsLoading(true)
    fetchProducts(storeId)
      .then((res) =>
        setProducts(res.data.products.filter((p) => getProductStatus(p) === 'active')),
      )
      .catch((e) => setNotice(getErrorMessage(e, 'Could not load products')))
      .finally(() => setProductsLoading(false))
  }, [open, storeId])

  const reset = useCallback(() => {
    setCart([])
    setCustomer(null)
    setStep('cart')
    setCustomerPickerOpen(false)
    setPendingProduct(null)
    setPendingVariants([])
    setVariantsLoading(false)
    setNotice(null)
  }, [])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSheetClose = () => {
    if (step === 'variants') {
      setStep('products')
      setPendingProduct(null)
      setPendingVariants([])
      return
    }
    if (step === 'products') {
      setStep('cart')
      return
    }
    handleClose()
  }

  const addToCart = (product: Product, variant: ProductVariant | null) => {
    const key = cartLineKey(product.id, variant?.id ?? null)
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity: 1,
          product,
          variant,
        },
      ]
    })
    setStep('cart')
    setPendingProduct(null)
    setPendingVariants([])
    setVariantsLoading(false)
  }

  const handleProductSelect = async (product: Product) => {
    if (variantsLoading) return
    setPendingProduct(product)
    setVariantsLoading(true)
    setNotice(null)
    try {
      const res = await fetchProduct(product.id, storeId)
      const active = res.data.variants.filter((v) => v.is_active)
      if (active.length > 0) {
        setPendingVariants(active)
        setStep('variants')
      } else {
        addToCart(product, null)
      }
    } catch (e) {
      setNotice(getErrorMessage(e, 'Could not load product'))
      setPendingProduct(null)
    } finally {
      setVariantsLoading(false)
    }
  }

  const updateQuantity = (key: string, quantity: number) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)))
  }

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key))
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + unitPrice(l.product, l.variant) * l.quantity, 0),
    [cart],
  )

  const taxAmount = 0
  const total = subtotal

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setNotice('Add at least one item')
      return
    }

    const items = cart.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
      ...(l.variantId ? { variant_id: l.variantId } : {}),
    }))

    const phone = customer ? customerDisplayPhone(customer) : null
    const name = customer?.name?.trim()

    setCheckoutLoading(true)
    setNotice(null)
    try {
      await createOrder({
        store_id: storeId,
        items,
        payment_method: 'cod',
        offline: true,
        ...(customer ? { customer_id: customer.id } : {}),
        ...(phone && phone.length >= 8 ? { whatsapp_number: phone } : {}),
        ...(name ? { name } : {}),
        ...(name || phone
          ? {
              shipping_address: {
                ...(name ? { name } : {}),
                ...(phone ? { phone_number: phone, whatsapp_number: phone } : {}),
              },
            }
          : {}),
      })
      reset()
      onCreated()
      onClose()
    } catch (e) {
      setNotice(getErrorMessage(e, 'Could not create order'))
    } finally {
      setCheckoutLoading(false)
    }
  }

  const modalTitle =
    step === 'cart' ? 'Create order' : step === 'products' ? 'Products' : (pendingProduct?.name ?? 'Choose variant')
  const modalSubtitle = step === 'variants' ? 'Select a variant to add' : undefined

  return (
    <>
      <Modal
        open={open && !customerPickerOpen}
        title={modalTitle}
        subtitle={modalSubtitle}
        onClose={handleSheetClose}
        footer={
          step === 'cart' ? (
            <div className="flex flex-col gap-2">
              {notice ? <p className="text-center text-[13px] font-medium text-[#E11D48]">{notice}</p> : null}
              <Button
                label={`Checkout · ${formatMoney(total, currency)}`}
                loading={checkoutLoading}
                disabled={cart.length === 0}
                onClick={() => void handleCheckout()}
                className="border-ink bg-ink"
              />
            </div>
          ) : undefined
        }
      >
        {step === 'cart' ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-surface py-3.5"
              onClick={() => setStep('products')}
            >
              <span className="text-lg text-ink">+</span>
              <span className="text-[15px] font-semibold text-ink">Add item</span>
            </button>

            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3"
              onClick={() => setCustomerPickerOpen(true)}
            >
              <span className="text-[14px] font-semibold text-ink">Add customer</span>
            </button>

            {customer ? (
              <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setCustomerPickerOpen(true)}
                >
                  <p className="truncate text-[14px] font-semibold text-ink">{customerDisplayName(customer)}</p>
                  {customerDisplayPhone(customer) || customer.email ? (
                    <p className="mt-0.5 truncate text-[13px] text-gray-500">
                      {customerDisplayPhone(customer) ?? customer.email}
                    </p>
                  ) : null}
                </button>
                <button type="button" onClick={() => setCustomer(null)} className="p-1 text-sm font-bold text-gray-400">
                  ✕
                </button>
              </div>
            ) : null}

            {cart.length > 0 ? (
              <div>
                {cart.map((line) => (
                  <OrderCartLine
                    key={line.key}
                    line={line}
                    currency={currency}
                    onQuantityChange={(q) => updateQuantity(line.key, q)}
                    onRemove={() => removeLine(line.key)}
                  />
                ))}

                <div className="mt-1 flex flex-col gap-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-[14px] text-gray-500">Items total</span>
                    <span className="text-[14px] text-ink">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-gray-500">Subtotal (incl. tax)</span>
                    <span className="text-[14px] text-ink">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-gray-500">Tax (0%)</span>
                    <span className="text-[14px] text-ink">{formatMoney(taxAmount, currency)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-gray-200 pt-3">
                    <span className="text-[16px] font-bold text-ink">Total</span>
                    <span className="text-[16px] font-bold text-ink">{formatMoney(total, currency)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-[14px] text-gray-400">Add items to start building this order</p>
            )}
          </div>
        ) : null}

        {step === 'products' ? (
          <OrderProductPickerBody
            products={products}
            loading={productsLoading}
            selecting={variantsLoading}
            currency={currency}
            onSelectProduct={(product) => void handleProductSelect(product)}
          />
        ) : null}

        {step === 'variants' ? (
          <OrderVariantPickerBody
            product={pendingProduct}
            variants={pendingVariants}
            loading={variantsLoading}
            currency={currency}
            onSelectVariant={(variant) => {
              if (pendingProduct) addToCart(pendingProduct, variant)
            }}
          />
        ) : null}
      </Modal>

      <OrderCustomerPickerModal
        open={customerPickerOpen}
        storeId={storeId}
        selectedCustomerId={customer?.id ?? null}
        onClose={() => setCustomerPickerOpen(false)}
        onSelectCustomer={setCustomer}
      />
    </>
  )
}
