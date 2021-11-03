<template>
  <div>
    <h2>{{ command.help.name }}</h2>
    <p>
      {{ command.help.msg }}
    </p>
    <section class="indent-1" v-if="command.help.args.length">
      <h3> Arguments </h3>
      <ul>
        <li v-for="arg of command.help.args" :key="arg.name + arg.type">
          {{ arg.name }} - <code>{{ arg.type }}</code>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import commands from '../data/commands.json'

// {
//   "help": {
//     "name": "play",
//     "msg": "Search for and play a track. Will search youtube if query returns no local results.",
//     "args": [
//       {
//         "name": "query",
//         "type": "string",
//         "required": true,
//         "description": "The track to search for and play|A YouTube video/playlist URL to play."
//       }
//     ],
//     "alias": "$play"
//   },
//   "modules": [],
//   "data": {
//     "name": "goplay",
//     "description": "Play Something",
//     "options": [
//       {
//         "type": 3,
//         "name": "query",
//         "description": "The track to search for and play|A YouTube video/playlist URL to play.",
//         "required": true
//       }
//     ]
//   }
// }

export default {
  name: 'CommandInfo',

  props: {
    command: {
      type: Object,
      required: true
    }
  }
}
</script>
