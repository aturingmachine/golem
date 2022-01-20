---
title: GolemAlias
description: Documentation for Golem's GolemAlias string formatting.
tags:
  - alias
  - GolemAlias
sidebar: auto
---

# GolemAlias String

A GolemAlias string is a string that represents an aliased command in Golem.

## Format

```
new alias name => golem command
```

The left side of the operation will become the new command. In this case `$newaliasname` will become a command, executing as `golem command`.

## Restrictions

A GolemAlias name must:
- not be an existing command or alias name
- be at least 3 characters

A valid command parameter is not needed, creating an alias with a broken command will register correctly and execute the invalid command on invocation.

## Functions

A GolemAlias can also make use of built in functions to construct complex commands. A function can be invoked in the command portion of a GolemAlias string using the format `:functionName[parameters]`

### `:random`

Select one of the provided parameters at random.

#### Usage

```
:random[option1; option2; option3]
```

### `:randomNum`

Select a random number within the provided range, inclusively.

#### Usage

```
:randomNum[8-28]
```
