/* eslint-disable @typescript-eslint/no-wrapper-object-types */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { defineStore } from 'pinia'
import { SearchOptions, type TransitModeOptions } from '@/types/SearchOptions'
import type { Place } from '@/types/Place'
import { currentDateString, currentTimeString, RFC3339fromTimeStringandDateString } from '@/scripts/Util'
import { ref } from 'vue'

export const useSearchOptionsStore = defineStore('searchOption', () => {
  const options = ref(new SearchOptions())
  const timeString = ref("")
  const dateString = ref("")

  function toggleMode(mode: keyof TransitModeOptions) {
    options.value.toggleMode(mode)
  }
  function toGraphQL() {
    return options.value.toGraphQL()
  }
  function setTime(time: string, date: string) {
    dateString.value = date
    timeString.value = time

    options.value.time = RFC3339fromTimeStringandDateString(time.length ? time : currentTimeString(), date.length ? date : currentDateString())
  }
  function saveSearchOptions() {
    const json = {
      options: {
        origin: options.value.origin as Place,
        destination: options.value.destination as Place,
        time: options.value.time,
        modes: options.value.modes
      },
      dateString: dateString.value,
      timeString: timeString.value
    }
    console.log(json.options.time?.toString())
    localStorage.setItem("hekinav.searchOptions", JSON.stringify(json))
  }
  function fromJSON(json: Object<unknown>) {
    dateString.value = json.dateString
    timeString.value = json.timeString
    options.value = new SearchOptions(json.options.origin, json.options.destination, json.options.time, json.options.modes)

  }
  function setPlace(place: Place, type: number) {
    if (type == 0) {
      options.value.origin = place
    } else {
      options.value.destination = place
    }
  }

  return { options, toggleMode, setPlace, toGraphQL, setTime, saveSearchOptions, fromJSON, dateString, timeString }
})
