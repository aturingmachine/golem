export const Http = {
  async get<T>(url: string) {
    console.log('[get]',  'http://' + __API_HOST__ + '/api' + url)

    const result = await fetch( 'http://' + __API_HOST__ + '/api' + url)

    return result.json() as T
  },

  async put<T>(url: string, body: unknown) {
    console.log('[put]',  'http://' + __API_HOST__ + '/api' + url)

    const result = await fetch('http://' + __API_HOST__ + '/api' + url, {
      method: 'put',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return result.json() as T
  },

  async post<T>(url: string, body: unknown) {
    console.log('[post]',  'http://' + __API_HOST__ + '/api' + url)

    const result = await fetch('http://' + __API_HOST__ + '/api' + url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return result.json() as T
  },

  async delete<T>(url: string) {
    console.log('[delete]',  'http://' + __API_HOST__ + '/api' + url)

    const result = await fetch('http://' + __API_HOST__ + '/api' + url, {
      method: 'delete'
    })

    return result.json() as T
  }
}
