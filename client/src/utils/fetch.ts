export const Http = {
  async get<T>(url: string) {
    console.log('[get]',  __API_URL__ + url)

    const result = await fetch( __API_URL__ + url)

    return result.json() as T
  },

  async put<T>(url: string, body: unknown) {
    const result = await fetch(__API_URL__ + url, {
      method: 'put',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return result.json() as T
  },

  async post<T>(url: string, body: unknown) {
    const result = await fetch(__API_URL__ + url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return result.json() as T
  },

  async delete<T>(url: string) {
    const result = await fetch(__API_URL__ + url, {
      method: 'delete'
    })

    return result.json() as T
  }
}
