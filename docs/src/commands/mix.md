---
title: Golem - mix
description: Documentation for Golem Bot's mix command.
tags:
  - mix
  - command
---

# mix

Enqueue a selection of tracks mixed off the current playing track. Can mix by either like artist or like tracks, defaulting to artist if no argument is provided.

## Examples

### Legacy Command

```
$go mix artist
$go mix track
```

### Slash Command

```
/gomix artist
/gomix track
```

## Arguments
- **mixtype** - `string`: How to execute the mix. The supported option will be parsed off the currently playing track, like tracks found, then shuffled and queued.


