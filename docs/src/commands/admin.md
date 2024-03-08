---
title: Golem - admin
description: Documentation for Golem Bot's admin command.
tags:
  - admin
  - command
---

# admin 

Perform Administrative tasks.

## Examples

### Legacy Command

```
$go admin librefresh
```

### Slash Command

```
/goadmin librefresh
```



## Subcommands
- **send-updates**: Send an update to all guilds that are subscribed to updates.
	### Arguments
	- **update_message*** - `string`: The message to send.

- **librefresh**: Refresh all libraries, reading in new listings.

- **bugs**: View last 5 bug reports.

- **config**: Update config settings for this server.
	### Arguments
	- **key*** - `string`: The option to update.
	- **value*** - `string`: The value to set it to.


