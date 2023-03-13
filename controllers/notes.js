/* The event handlers of routes are commonly referred to as controllers, and for this reason we have created a new controllers directory. All of the routes related to notes are now in the notes.js module under the controllers directory. */

/* The router is in fact a middleware, that can be used for defining "related routes" in a single place, which is typically placed in its own module. */
const notesRouter = require('express').Router()
const Note = require('../models/note')

const { userExtractor } = require('../utils/middleware')

notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 })
  response.json(notes)
})

notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
})

notesRouter.post('/', userExtractor, async (request, response) => {
  //console.log('notesRouter')
  const body = request.body

  if (!request.token) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = request.user

  const note = new Note({
    content: body.content,
    important: body.important || false,
    checked: body.checked || false,
    user: user.id,
  })

  const savedNote = await note.save()
  user.notes = user.notes.concat(savedNote._id)
  await user.save()

  response.status(201).json(savedNote)
})

notesRouter.delete('/', userExtractor, async (request, response) => {
  //console.log('notesRouter.delete')
  if (!request.token) {
    //console.log('Problem')
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = request.user
  const noteIds = request.body.ids
  //console.log(noteIds)
  //console.log(user)
  const result = await Note.deleteMany({ _id: { $in: noteIds }, user: user.id })
  if (result.deletedCount > 0) {
    return response.status(204).end()
  }
  return response.status(401).json({
    error: 'Unauthorized to access the notes',
  })
})

notesRouter.put('/:id', async (request, response) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
    checked: body.checked,
  }
  const updatedNote = await Note.findByIdAndUpdate(request.params.id, note, {
    new: true,
  })
  response.json(updatedNote)
})

module.exports = notesRouter
