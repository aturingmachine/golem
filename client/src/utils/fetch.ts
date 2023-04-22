export const Http = {
  async get<T>(url: string) {
    const result = await fetch(__API_URL__ + url)

    return result.json() as T
  },

  async delete<T>(url: string) {
    const result = await fetch(__API_URL__ + url, {
      method: 'delete'
    })

    return result.json() as T
  }
}
