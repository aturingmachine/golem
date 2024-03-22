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



### Help Message
```
Command admin:
  Perform Administrative tasks.  
--Sub Commands--
    - send-updates [update_message]
        Send an update to all guilds that are subscribed to updates.
          [update_message]
            The message to send.
    - librefresh
        Refresh all libraries, reading in new listings.
    - bugs
        View last 5 bug reports.
    - config [key] [value]
        Update config settings for this server.
          [key]
            The option to update.
          [value]
            The value to set it to.
  
--Example Usage--
    $go admin librefresh


*************
arguments marked [] are required
arguments marked <> are optional```

