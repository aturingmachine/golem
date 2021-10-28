module.exports = {
  /**
   * Configuration for the Discord client connection. Required
   * to run the application.
   */
  discord: {
    token: '',
    clientId: '',
    serverIds: [],
  },

  /**
   * Configuration for images.
   *
   * fallbackPath - path to the default image to show if no album art is available.
   * avgColorAlgorithm - algorithm to determine the average color of an application, one of:
   * 'sqrt' | 'dominant' | 'simple'.
   */
  image: {
    fallbackPath: '',
    avgColorAlgorithm: '',
  },

  /**
   * For connections to LastFM, used for mixing.
   *
   * apiKey - your API Key to LastFM.
   */
  lastfm: {
    apiKey: '',
  },

  /**
   * Configuration for parsing local libraries.
   *
   * paths - list of absolute paths to your music. All files under a directory will be parsed.
   */
  library: {
    paths: [''],
  },

  /**
   * Configuration for the MongoDB Connection
   *
   * uri - the uri for the mongo instance.
   */
  mongo: {
    uri: '',
  },

  /**
   * Configuration for the Connection to a Plex Media Server. Used for playlists.
   *
   * uri - the uri of the Plex Media Server.
   * appId - a unique id for this application, a random guid should suffice.
   * username - the username to connect as.
   * password - the password for the account to connect as.
   */
  plex: {
    uri: '',
    appId: '',
    username: '',
    password: '',
  },

  /**
   * Configuration for search
   *
   * forceWeightTerms - terms that should be weighted down by the search function.
   * For example a search for "Twice I Can't Stop Me" may retrieve the track "Twice I Can't Stop Me (English Version)".
   * We counter this by adding 'english' to the below array rejecting results containing the below terms if there is a
   * close match that exists without one of the below terms.
   */
  search: {
    forceWeightTerms: [''],
  },

  /**
   * Configuration for the Web Application
   *
   * apiPort - the port to run the application on.
   */
  web: {
    apiPort: 3000,
  },

  /**
   * Enable/disable the ability to play YouTube videos as Tracks.
   */
  youtube: true,
}
