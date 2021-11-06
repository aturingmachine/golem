---
title: Modules
description: Documentation for Golem's GolemAlias module interface.
tags:
  - modules
  - plex
  - youtube
  - lastfm
  - web
sidebar: auto
---

# Golem Modules

Golem has the ability to gracefully disable functionality in the situation that you do not have the required external dependencies or the need for their functionality.

## Core

Core is the only required module for Golem to run. This enables Golem to connect to and interact with Discord.

## Music

Enables playing of local audio files via Discord voice chat. Second to [Core Module](./modules.md#core) this module is the bulk of Golem's functionality. Golem can run without it, relying on the [YouTube Module](./modules.md#youtube) to provide media capabilities.

## Plex

Enables reading playlists from a Plex Media Server that uses one or more loaded Golem Libraries as the content for the playlist.

> See also: the [$go playlist](../commands/playlist.md) command

## YouTube

Enables playing YouTube videos as tracks. Requires ffmpeg to be on the path of the user running Golem.

> See also: the [$go play](../commands/play.md) command

## LastFM

Enables mixing; enqueueing short lists of tracks based on similar tracks/artists to what is currently playing. Mixed tracks are taken from the Local Library.

> See also: the [$go mix](../commands/mix.md) command

## Web

Enables a local web server with a web application to aid in the management of your Golem installation.
