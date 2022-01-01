---
title: Golem - Extended Args
description: Documentation for Golem's extended argument parsing interface.
tags:
  - arguments
  - advanced
  - extended
---

# Extended Arguments

Extended Arguments are arguments to a command that match a few criteria:

- placed at the end of a command string after a `--`
- cannot be executed on Slash Commands
- modify some deeper configuration of a command
- will not fail a command if used improperly

For example the `$go play` command has extended args in the case you are requesting a YouTube playlist be played. We can set the number of items to pull and even shuffle the selected listings:

`$go play <youtube-playlist> -- limit=50 shuffle=true`

This will override the default playlist fetch limit of 20 and also run the listing through the shuffler.

## Applications

Extended Arguments can be helpful when making your Custom Aliases more robust. Continuing on the example above for `$go play` - if we have some huge YouTube playlist of Lofi beats to chill/relax/study to that is too large to listen to in a single sitting. Continuing to listen to this playlist with the default functionality would mean we hear the same beginning of the playlist every time. Instead we could make a Custom Alias to mix the playlist for us.

```
// Get a better shuffle of our lofi beats
// using limit=35 should get us ~90 minutes of music
// shuffle=true will help keep the alias fresh with continued usage
$go alias create studytime => $go play <playlist-url> -- limit=35 shuffle=true
```

In the context of Custom Aliases we can also set these to the value of our Alias Functions:

```
// Do the same as above but grab a range of tracks
$go alias create studytime => $go play <playlist-url> -- limit=:randomNum[30-40] shuffle=true

// Now we have an alias that will play 30-40 tracks from one of the three 
// provided Lofi playlists
// which should remain fresh for a longer time than the above examples
$go alias create studytime => $go play :random[<playlist-url-1>; <playlist-url-2>; <playlist-url-3>] -- limit=:randomNum[30-40] shuffle=true
```

We can also use Extended Arguments to pass a description to this Custom Alias:

```
// The first instance of "--" is used to denote the extended 
// args for the inner "$go play" command
// The second instance tells Golem that we are done writing the 
// Expansion of our Custom Alias and 
// the rest of the message should be considered part of the outer 
// "$go alias create" command
$go alias create studytime => $go play :random[<playlist-url-1>; <playlist-url-2>; <playlist-url-3>] -- limit=:randomNum[30-40] shuffle=true -- desc="~90 Minutes of Fresh Lofi Beats"
```
