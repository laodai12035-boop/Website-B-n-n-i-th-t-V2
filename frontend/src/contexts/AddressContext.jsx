import React, { createContext, useContext, useState, useEffect } from 'react'
import addressService from '@/services/addressService'
import { useAuth } from '@/contexts/AuthContext'

const AddressContext = createContext()

export const AddressProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [defaultAddress, setDefaultAddress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAddresses = async () => {
    if (!isAuthenticated) {
      setAddresses([])
      setDefaultAddress(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await addressService.getAddresses()
      setAddresses(data)
      const def = data.find((a) => a.is_default) || data[0] || null
      setDefaultAddress(def)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách địa chỉ giao hàng.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [isAuthenticated])

  const addAddress = async (data) => {
    const newAddress = await addressService.createAddress(data)
    await fetchAddresses()
    return newAddress
  }

  return (
    <AddressContext.Provider
      value={{
        addresses,
        defaultAddress,
        loading,
        error,
        fetchAddresses,
        addAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  )
}

export const useAddress = () => useContext(AddressContext)
