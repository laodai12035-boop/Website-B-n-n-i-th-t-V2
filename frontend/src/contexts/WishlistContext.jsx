import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import wishlistService from '@/services/wishlistService'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Nạp danh sách yêu thích khi người dùng đã đăng nhập
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated || !user) {
        setWishlistItems([])
        return
      }

      setLoading(true)
      try {
        const items = await wishlistService.getWishlist()
        setWishlistItems(items || [])
      } catch (err) {
        console.error('Error fetching wishlist:', err)
        setWishlistItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [isAuthenticated, user])

  // Kiểm tra sản phẩm có trong wishlist hay không
  const isWishlisted = (productId) => {
    return wishlistItems.some((item) => item.id === productId)
  }

  // Toggle sản phẩm vào/ra wishlist
  const toggleWishlist = async (product) => {
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích!')
      navigate('/login')
      return
    }

    try {
      const res = await wishlistService.toggleWishlist(product.id)
      if (res.is_wishlisted) {
        setWishlistItems((prev) => [product, ...prev])
      } else {
        setWishlistItems((prev) => prev.filter((item) => item.id !== product.id))
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err)
    }
  }

  // Xóa sản phẩm khỏi wishlist
  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated || !user) return

    try {
      await wishlistService.removeFromWishlist(productId)
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId))
    } catch (err) {
      console.error('Error removing from wishlist:', err)
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        loading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
