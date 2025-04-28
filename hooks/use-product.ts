import { create } from 'zustand'
import Axios from '~/lib/axios'
import { ModifierEndpoints } from '~/lib/constants'
import { iModifier, iProduct } from '~/types'

type ProductState = {
  isOpen: boolean
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  modifiers: iModifier[]
  setModifiers: (modifiers: iModifier[]) => void
  fetchModifiers: () => void
}

export const useProduct = create<ProductState>(set => ({
  isOpen: false,
  isLoading: false,
  setIsLoading: isLoading => set({ isLoading }),
  modifiers: [],
  setModifiers: modifiers => set({ modifiers }),
  fetchModifiers: async () => {
    try {
      const { data } = await Axios.get(ModifierEndpoints.getAll)
      set({ modifiers: data?.data })
    } catch (error) {
      console.log(error)
    }
  },
}))
