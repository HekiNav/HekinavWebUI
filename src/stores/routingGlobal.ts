import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useRoutingGlobalStore = defineStore('routingGlobal', () => {
  const itieneraries: object | undefined = undefined
  const routingView: Ref<number> = ref(RoutingView.HOME)
  function pageBack() {
    if (routingView.value == RoutingView.LIST) {
      routingView.value = RoutingView.HOME
    } else {
      routingView.value--

    }
  }

  return { itieneraries, routingView, pageBack }
})
export enum RoutingView {
  HOME,
  LOADING,
  LIST,
  DETAILS
}

