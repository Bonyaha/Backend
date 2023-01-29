/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log(
    'Please provide the password as an argument: node mongo.js <password>'
  )
  process.exit(1)
}

const password = process.argv[2]
const name = process.argv[3]
if (name === 'Roman') {
  console.log('Yes')
}

const url = `mongodb+srv://Bosher:${password}@cluster0.megdfbi.mongodb.net/noteApp?retryWrites=true&w=majority`

const noteSchema = new mongoose.Schema({
  content: String,
  date: Date,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

mongoose
  .connect(url)
  .then((result) => {
    console.log('connected')

    const note = new Note({
      content: 'HTML is Easy',
      date: new Date(),
      important: true,
    })

    return note.save()
  })
  .then(() => {
    const note2 = new Note({
      id: 2,
      content: 'Browser can execute only Javascript',
      date: '2022-05-30T18:39:34.091Z',
      important: false,
    })
    return note2.save()
  })
  .then(() => {
    const note3 = new Note({
      id: 3,
      content:
        'GET and POST are the most important methods of HTTP protocol(test)',
      date: '2022-05-30T19:20:14.298Z',
      important: true,
    })
    return note3.save()
  })
  .then(() => {
    console.log('note saved!')
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
