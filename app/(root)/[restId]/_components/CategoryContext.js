'use client'
import React, { createContext, useContext, useState } from 'react'

const CategoryContext = createContext()

export function CategoryProvider({ children }) {
  const [activeCategory, setActiveCategory] = useState('ZipZap FAVORITES')

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  return useContext(CategoryContext)
}
