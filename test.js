const mongo = require('mongodb')

async function run() {
  const a = await mongo.connect('mongodb://localhost:27017')
  console.log(a)
}

run()
