export const useApiClient = () => {
  const { $apiFetch } = useNuxtApp()
  if (!$apiFetch) throw new Error('API client is not ready')
  return $apiFetch
}

export const getApiErrorStatus = (error) => Number(
  error?.status ||
  error?.statusCode ||
  error?.response?.status ||
  error?.data?.status ||
  error?.data?.statusCode ||
  0
)

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  if (error?.data?.message) return error.data.message

  const argumentErrors = error?.data?.argumentErrors
  if (argumentErrors) {
    const message = Object.values(argumentErrors)
      .flat()
      .find((item) => item?.message)
      ?.message

    if (message) return message
  }

  return error?.message || fallback
}
