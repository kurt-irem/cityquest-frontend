import { watch } from 'vue'

export function useAlertDismiss(successRef, errorRef, duration = 2000) {
  watch(successRef, (newVal) => {
    if (newVal) {
      setTimeout(() => {
        successRef.value = ''
      }, duration)
    }
  })

  watch(errorRef, (newVal) => {
    if (newVal) {
      setTimeout(() => {
        errorRef.value = ''
      }, duration)
    }
  })
}
