import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1'
const legacyApiBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '')

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const legacyApi = axios.create({
  baseURL: legacyApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

for (const client of [api, legacyApi]) {
  client.interceptors.request.use((config) => {
    const token = window.localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
