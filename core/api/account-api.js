import { useApiClient } from './http'

export const useAccountApi = () => {
  const api = useApiClient()

  return {
    getUserProfile: () => api('/api/account/profile')
  }
}
