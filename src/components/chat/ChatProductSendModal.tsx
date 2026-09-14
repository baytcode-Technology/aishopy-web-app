'use client'

import { OrderProductPickerBody } from '@/components/orders/order-create/OrderProductPickerBody'
import { OrderVariantPickerBody } from '@/components/orders/order-create/OrderVariantPickerBody'
import { Modal } from '@/components/ui/Modal'
import { fetchProduct, fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  buildProductShareMessage,
  resolveProductShareImageUrl,
} from '@/core/lib/product-share-message'
import { getProductStatus } from '@/core/lib/product-status'
import type { Product, ProductVariant } from '@/core/types/product'
import { useCallback, useEffect, useState } from 'react'

type Step = 'products' | 'variants'

export type ProductShareSendPayload = {
  text: string
  imageUrl: string | null
}

type Props = {
  visible: boolean
  storeId: number
  storeSlug: string
  currency?: string
  onClose: () => void
  onSend: (payload: ProductShareSendPayload) => void
}

export function ChatProductSendModal({
  visible,
  storeId,
  storeSlug,
  currency,
  onClose,
  onSend,
}: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [step, setStep] = useState<Step>('products')
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingVariants, setPendingVariants] = useState<ProductVariant[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('products')
    setPendingProduct(null)
    setPendingVariants([])
    setVariantsLoading(false)
    setNotice(null)
  }, [])

  useEffect(() => {
    if (!visible || !storeId) return
    reset()
    setProductsLoading(true)
    fetchProducts(storeId)
      .then((res) =>
        setProducts(res.data.products.filter((p) => getProductStatus(p) === 'active')),
      )
      .catch((e) => setNotice(getErrorMessage(e, 'Could not load products')))
      .finally(() => setProductsLoading(false))
  }, [visible, storeId, reset])

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
    handleClose()
  }

  const sendProduct = (product: Product, variant: ProductVariant | null) => {
    const text = buildProductShareMessage({
      product,
      variant,
      currency,
      storeSlug,
    })
    reset()
    onSend({
      text,
      imageUrl: resolveProductShareImageUrl(product, variant),
    })
    onClose()
  }

  const handleProductSelect = async (product: Product) => {
    if (variantsLoading) return
    setPendingProduct(product)
    setVariantsLoading(true)
    try {
      const res = await fetchProduct(product.id, storeId)
      const detailProduct = res.data.product
      const active = res.data.variants.filter((v) => v.is_active)
      if (active.length > 0) {
        setPendingProduct(detailProduct)
        setPendingVariants(active)
        setStep('variants')
      } else {
        sendProduct(detailProduct, null)
      }
    } catch (e) {
      setNotice(getErrorMessage(e, 'Could not load product'))
      setPendingProduct(null)
    } finally {
      setVariantsLoading(false)
    }
  }

  const modalTitle = step === 'products' ? 'Send product' : (pendingProduct?.name ?? 'Choose variant')
  const modalSubtitle = step === 'variants' ? 'Select a variant to send' : 'Choose a product to share'

  return (
    <Modal
      open={visible}
      onClose={handleSheetClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      zClass="z-50"
    >
      {notice ? <p className="mb-3 text-sm font-semibold text-[#E11D48]">{notice}</p> : null}
      {step === 'products' ? (
        <OrderProductPickerBody
          products={products}
          loading={productsLoading}
          selecting={variantsLoading}
          currency={currency}
          onSelectProduct={(product) => void handleProductSelect(product)}
        />
      ) : (
        <OrderVariantPickerBody
          product={pendingProduct}
          variants={pendingVariants}
          loading={variantsLoading}
          currency={currency}
          onSelectVariant={(variant) => {
            if (pendingProduct) sendProduct(pendingProduct, variant)
          }}
        />
      )}
    </Modal>
  )
}
