import { createContext, useContext, useState, useEffect } from 'react'

const CompareContext = createContext()

const MAX_COMPARE_ITEMS = 3

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = localStorage.getItem('compare_items')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('compare_items', JSON.stringify(compareItems))
  }, [compareItems])

  const isComparing = (productId) => {
    return compareItems.some((item) => item.id === productId)
  }

  const addToCompare = (product) => {
    if (!product || !product.id) return

    if (isComparing(product.id)) {
      return
    }

    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      alert('⚠️ Đã đạt giới hạn so sánh tối đa (chỉ được so sánh tối đa 3 sản phẩm).')
      return
    }

    setCompareItems((prev) => [...prev, product])
  }

  const removeFromCompare = (productId) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const clearCompare = () => {
    setCompareItems([])
  }

  const value = {
    compareItems,
    isComparing,
    addToCompare,
    removeFromCompare,
    clearCompare,
    maxCompareItems: MAX_COMPARE_ITEMS,
  }

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export const useCompare = () => {
  const context = useContext(CompareContext)
  if (!context) {
    throw new Error('useCompare phải được sử dụng bên trong <CompareProvider>')
  }
  return context
}
