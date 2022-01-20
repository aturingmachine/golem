---
title: Tracks
description: Documentation for Tracks.
tags:
  - track
  - youtube
  - music
  - player
sidebar: auto
---

# Tracks

At it's core Golem is a Bot to play Music. Stemming from this is the central data structure of a `Track`. Tracks represent a uniform interface for getting data about a `Listing`, hooking into play lifecycles, and creating playable Audio Resources from its data.

## LocalTrack <badge text="Music" type="music-badge"/> 

A `LocalTrack` represents a playable media file accessed via a Filesystem that Golem has access to. These tracks are able to provide robust experiences and presentations via metadata that can be embedded in the file.

## YouTubeTrack <badge text="Youtube" type="youtube-badge"/>

A `YouTubeTrack` is a wrapper for some video on YouTube. The wrapper enables the video to be accessed and interacted with via the same interface as a `LocalTrack`. These provide less robust experiences and presentations via a lack of structured metadata but allow Golem to present a much wider array of media.
