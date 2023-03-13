const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')

const Note = require('../models/note')
const User = require('../models/user')

const loginWithTestUser = async () => {
  const credentials = {
    username: helper.user.username,
    password: helper.user.password,
  }
  const response = await api
    .post('/api/login')
    .send(credentials)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  return response.body.token
}

/* beforeAll(async () => {
  await User.deleteMany({})
  const user = {
    username: helper.user.username,
    name: 'test user',
    password: helper.user.password,
  }
  await api
    .post('/api/users')
    .send(user)
    .set('Accept', 'application/json')
    .expect('Content-Type', /application\/json/)
}) */

beforeEach(async () => {
  await Note.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash(helper.user.password, 10)
  let user = new User({
    username: helper.user.username,
    name: 'test user',
    passwordHash: passwordHash,
  })

  for (let note of helper.initialNotes) {
    let newNote = new Note(note)
    newNote.user = user.toJSON().id.toString()
    newNote = await newNote.save()
    user.notes.concat(newNote.toJSON().id.toString())
  }
  user = await user.save()
})

describe('when there is initially some notes saved', () => {
  test('notes are returned as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')

    expect(response.body).toHaveLength(helper.initialNotes.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes')

    const contents = response.body.map((r) => r.content)

    expect(contents).toContain('Browser can execute only JavaScript')
  })
})

describe('viewing a specific note', () => {
  test('succeeds with a valid id', async () => {
    const notesAtStart = await helper.notesInDb()

    const noteToView = notesAtStart[0]

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    resultNote.body.user = mongoose.Types.ObjectId(resultNote.body.user)
    console.log('expected:', noteToView)
    console.log('received:', resultNote.body)

    expect(resultNote.body).toEqual(noteToView)
  })

  test('fails with statuscode 404 if note does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api.get(`/api/notes/${validNonexistingId}`).expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api.get(`/api/notes/${invalidId}`).expect(400)
  })
})

describe('addition of a new note', () => {
  test('succeeds with valid data', async () => {
    const token = await loginWithTestUser()
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
    }

    await api
      .post('/api/notes')
      .send(newNote)
      .set('Authorization', `bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)

    const contents = notesAtEnd.map((n) => n.content)
    expect(contents).toContain('async/await simplifies making async calls')
  })

  test('fails with status code 400 if data invalid', async () => {
    const newNote = {
      important: true,
    }

    await api.post('/api/notes').send(newNote).expect(400)

    const notesAtEnd = await helper.notesInDb()

    expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
  })
})

describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const token = await loginWithTestUser()
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[0]

    await api
      .delete('/api/notes/')
      .set('Authorization', `bearer ${token}`)
      .send({ ids: [noteToDelete.id] })
      .expect(204)

    const notesAtEnd = await helper.notesInDb()

    expect(notesAtEnd).toHaveLength(helper.initialNotes.length - 1)

    const contents = notesAtEnd.map((r) => r.content)

    expect(contents).not.toContain(noteToDelete.content)
  })
})
describe('modifying of note', () => {
  //put
  test('note can be modified', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToModify = notesAtStart[0]
    console.log(`from start: ${noteToModify.important}`)

    noteToModify.important = !noteToModify.important

    console.log(`after change: ${noteToModify.important}`)

    noteToModify.content = 'HTML is super easy'
    await api
      .put(`/api/notes/${noteToModify.id}`)
      .send(noteToModify)
      .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()

    console.log(`at the end: ${notesAtEnd[0].important}`)

    expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
    expect(notesAtEnd[0].important).toBe(noteToModify.important)
    expect(notesAtEnd[0].content).toContain('HTML is super easy')
  })
})
afterAll(async () => {
  await mongoose.connection.close()
})
