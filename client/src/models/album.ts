export type Album = {
  _id: string
  name: string
  artist: string
  path: string
  fileRoot: string
  covers: {
    small: {
      path: string
    },
    med: {
      path: string
    },
    large: {
      path: string
    },
    xlarge: {
      path: string
    }
  }
}
