# Golem

Golem is a Discord Bot mean to be run locally as a sort-of-replacement for music playing bots of old.

## Documentation

Detailed documentation can be found on the [Golem Documentation Site](https://aturingmachine.github.io/golem/).

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
cp config.example.yml config.yml

# Dev only - dependecy install helper
bash scripts/dev-install.sh
```
