import axios from "axios"

export class AnalyticsService {
  static async get() {
    const res = await axios.get(`http://${window.location.hostname}:3828/api/analytics`)

    console.log(res)

    return res.data
  }
}
