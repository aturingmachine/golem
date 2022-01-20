---
title: Admin
---

# External Dependencies

## Mongo

Mongo is used to store parsed data for Golem. This includes indexes of your local library, custom aliases, and permissions. Mongo is _required_ for Golem to operate as intended.

- [Mongo Installation Instructions](https://docs.mongodb.com/manual/installation/)

## ytdlp

[ytdlp](https://github.com/yt-dlp/yt-dlp) is a tool for reading data from YouTube. Golem's implementation of YouTube access is "lightweight" implementation you would see in some of the wrapper npm packages that exist. This was done due to regressions/bugs occurring within those packages, that were being solved in ytdlp. Because of this Golem requires a local installation of ytdlp in order to make use of the YouTube module and it's functionality.

- [ytdlp Installation Instructions](https://github.com/yt-dlp/yt-dlp#installation)
