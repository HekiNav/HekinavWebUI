import { defineStore } from 'pinia'
import { SearchOptions, type TransitModeOptions } from '@/types/SearchOptions'
import type { Place } from '@/types/Place'

export const useSearchOptionsStore = defineStore('searchOption', () => {
  const options = new SearchOptions()

  function toggleMode(mode: keyof TransitModeOptions) {
    options.toggleMode(mode)
  }
  function setPlace(place: Place, type: number) {
    if (type == 0) {
      options.origin = place
    } else {
      options.destination = place
    }
  }

  return { options, toggleMode, setPlace }
})
