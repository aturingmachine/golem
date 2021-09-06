// Require the necessary discord.js classes
import { Client, Intents } from 'discord.js'
import { config } from 'dotenv'
config()
import { Config } from './utils/config'

console.log('token >>>>>', Config.token)

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Ready!')
})

// Login to Discord with your client's token
client.login(Config.token)
