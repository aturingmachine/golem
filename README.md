# Golem

## Features

- Stream local music to Discord voice channels
- Robust queue management
- Read playlists from a Plex Media Server
- Mix like tracks/artists via LastFM matching
- Stream YouTube audio to Discord voice channels
- Support for custom aliased commands

## Installation

```sh
# Clone Repo
git clone git@github.com:aturingmachine/discord-bot.git

# Install Dependencies
npm ci

# Copy configuration files
cp config.example.js config.js
```

## Configuring Golem

TODO

1. discord dev help
2. setting up config values
3. running mongo

## Golem Modules

Golem can be configured to only enable the features you want. As of writing the code/dependencies for supporting these will still exist on your local Installation but Golem will disable their functionality.

 - Plex: Integrate with a Plex Media Server to read existing playlists
 - LastFm: Allow queueing tracks of like Artists/Tracks using LastFM's similarity API
 - Web: Enable a Web Client for managing Golem
 - Youtube: Enable Streaming Youtube audio to the Voice Channel
