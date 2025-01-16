import { defineStore } from 'pinia'
import { SearchOptions, type TransitModeOptions } from '@/types/SearchOptions'
import type { Place } from '@/types/Place'
import { currentDateString, currentTimeString, RFC3339fromTimeStringandDateString } from '@/scripts/Util'

export const useSearchOptionsStore = defineStore('searchOption', () => {
  const options = new SearchOptions()

  function toggleMode(mode: keyof TransitModeOptions) {
    options.toggleMode(mode)
  }
  function toGraphQL() {
    return options.toGraphQL()
  }
  function setTime(time: string, date: string) {
    options.time = RFC3339fromTimeStringandDateString(time.length ? time : currentTimeString(), date.length ? date : currentDateString())
  }
  function setPlace(place: Place, type: number) {
    if (type == 0) {
      options.origin = place
    } else {
      options.destination = place
    }
  }

  return { options, toggleMode, setPlace, toGraphQL, setTime }
})
