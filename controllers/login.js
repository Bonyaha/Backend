const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body

  const user = await User.findOne({ username })
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password',
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }
  const expiresIn = 60 * 60
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn,
  })

  const expirationDate = new Date(Date.now() + expiresIn * 1000) // set expiration date to 1 hour from now
  response.status(200).send({
    token,
    username: user.username,
    name: user.name,
    expirationDate: expirationDate.toISOString(), // convert expiration date to ISO format
  })
})

module.exports = loginRouter
