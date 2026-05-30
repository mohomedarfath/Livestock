import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../context/TenantContext'
import { shopProductsRepository } from '../services/repositories/shopProductsRepository'

export function useShopProducts() {
  const { currentOrganization } = useTenant()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const nextProducts = await shopProductsRepository.list(currentOrganization?.id)
      setProducts(nextProducts)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load shop products.')
    } finally {
      setLoading(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    reload()
  }, [reload])

  async function createProduct(product) {
    const created = await shopProductsRepository.create(currentOrganization?.id, product)
    setProducts((current) => [...current, created].sort((left, right) => left.name.localeCompare(right.name)))
    return created
  }

  async function updateProduct(productId, updates) {
    const nextProducts = await shopProductsRepository.update(currentOrganization?.id, productId, updates)
    setProducts(nextProducts)
    return nextProducts
  }

  async function removeProduct(productId) {
    const nextProducts = await shopProductsRepository.remove(currentOrganization?.id, productId)
    setProducts(nextProducts)
    return nextProducts
  }

  async function adjustStock(productId, quantity, movement) {
    const nextProducts = await shopProductsRepository.adjustStock(currentOrganization?.id, productId, quantity, movement)
    setProducts(nextProducts)
    return nextProducts
  }

  return { products, loading, error, reload, createProduct, updateProduct, removeProduct, adjustStock }
}
