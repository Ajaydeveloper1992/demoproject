import { create } from 'zustand'
import { iCategory } from '~/types'

type CategoryState = {}

export const useCategory = create<CategoryState>(set => ({}))
