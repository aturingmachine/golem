# Golem

Golem is a Discord Bot mean to be run locally as a sort-of-replacement for music playing bots of old.

## Documentation

Detailed documentation can be found on the [Golem Documentation Site](https://aturingmachine.github.io/golem/).

## External Dependencies

- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [MongoDB](https://docs.mongodb.com/manual/installation/)

## Features

- Stream local music to Discord voice channels
- Robust queue management
- Read playlists from a Plex Media Server
- Mix like tracks/artists via LastFM matching
- Stream YouTube audio to Discord voice channels
- Support for custom aliased commands

## Installation
> TODO?
```sh
# Clone Repo
git clone git@github.com:aturingmachine/golem.git

# Install Dependencies
npm ci

# Copy configuration files
cp config.example.yml config.yml

# Dev only - dependecy install helper
bash scripts/dev-install.sh
```


## V2 TODO
[X] - Bot Status
[] - Interactive Response Embeds
  [] - Wide Search Results
  [X] - Artist Search Results
  [] - Playlists?
[] - YT Caching
  [X] - Write/Read cached results
  [X] - Clear old cached results
  [X] - Clear cached results when low on disk space
  [X] - Configurable cache size
  [X] - "reset" cache expire timer when cache hit
  [X] - be able to bust cache via command and/or web interface
    [X] - web
    [] - command
  [X] - web interface for cached results
  [X] - play with ignoring cached result
  [X] - dont cache if we skip the track
