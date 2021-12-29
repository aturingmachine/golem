import axios from "axios"

export const ListingService = {
  async get(offset = 0) {
    const res = await axios.get(`http://${window.location.hostname}:3828/api/listings/ids`, { params: { offset } })

    return res.data
  },

  async getById(id) {
    const res = await axios.get(`http://${window.location.hostname}:3828/api/listings/${id}`)

    return res.data
  },

  async getAlbum(id) {
    const res = await axios.get(`http://${window.location.hostname}:3828/api/listings/album/${id}`)

    return res.data
  }
}
