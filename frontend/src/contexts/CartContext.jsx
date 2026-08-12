import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import cartService from '@/services/cartService'
import { useAuth } from '@/contexts/AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch Cart from Backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      setCartCount(0)
      setCartTotal(0)
      return
    }
    setLoading(true)
    try {
      const data = await cartService.getCart()
      setItems(data.items || [])
      setCartCount(data.cart_count || 0)
      setCartTotal(data.subtotal || 0)
    } catch (err) {
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Add Item to Cart
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      // Local fallback if not logged in
      alert('Vui lòng đăng nhập để sử dụng tính năng Giỏ hàng!')
      return
    }

    try {
      const data = await cartService.addToCart(product.id, quantity)
      setItems(data.items || [])
      setCartCount(data.cart_count || 0)
      setCartTotal(data.subtotal || 0)
      setIsCartOpen(true) // Open drawer to show added item
      return data
    } catch (err) {
      throw err
    }
  }

  // Buy Now Express Checkout
  const buyNow = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng Mua ngay!')
      return
    }

    try {
      const data = await cartService.buyNow(product.id, quantity)
      setItems(data.items || [])
      setCartCount(data.cart_count || 0)
      setCartTotal(data.subtotal || 0)
      return data
    } catch (err) {
      throw err
    }
  }

  // Update Item Quantity
  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return
    try {
      const data = await cartService.updateQuantity(productId, quantity)
      setItems(data.items || [])
      setCartCount(data.cart_count || 0)
      setCartTotal(data.subtotal || 0)
      return data
    } catch (err) {
      throw err
    }
  }

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return
    try {
      const data = await cartService.removeFromCart(productId)
      setItems(data.items || [])
      setCartCount(data.cart_count || 0)
      setCartTotal(data.subtotal || 0)
      return data
    } catch (err) {
      console.error('Error removing item from cart:', err)
    }
  }

  // Clear Entire Cart
  const clearCart = async () => {
    if (!isAuthenticated) return
    try {
      const data = await cartService.clearCart()
      setItems([])
      setCartCount(0)
      setCartTotal(0)
      return data
    } catch (err) {
      console.error('Error clearing cart:', err)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        loading,
        addToCart,
        buyNow,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
