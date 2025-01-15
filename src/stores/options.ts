import { defineStore } from 'pinia'
import { SearchOptions, type TransitModeOptions } from '@/types/SearchOptions'

export const useSearchOptionsStore = defineStore('searchOption', () => {
  const options = new SearchOptions()

  function toggleMode(mode: keyof TransitModeOptions) {
    options.toggleMode(mode)
  }

  return { options, toggleMode }
})
