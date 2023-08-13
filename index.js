require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const Person = require('./models/person')

const cors = require('cors')

app.use(cors())

app.use(express.static('build'))

app.use(express.json())

morgan.token('body', function (req, res) { return JSON.stringify(req.body)})

//app.use(morgan('tiny'))

app.use(morgan((tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    tokens.body(req, res)
  ].join(' ')
}))

//const Person = mongoose.model('Person', personSchema)

// let persons = [
//     {
//       id: 1,
//       name: "Arto Hellas",
//       number: "040-123456"
//     },
//     {
//       id: 2,
//       name: "Ada Lovelace",
//       number: "39-44-5323523"
//     },
//     {
//       id: 3,
//       name: "Dan Abramov",
//       number: "12-43-234345"
//     },
//     {
//       id: 4,
//       name: "Mary Poppendieck",
//       number: "39-23-6423122"
//     }
// ]

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

// app.get('/api/persons', (request, response) => {
// 	response.json(persons)
// })

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  // const id = Number(request.params.id)
  // const person = persons.find(person => person.id === id)

  // if (person) {
  // 	response.json(person)
  // } else {
  // 	response.status(404).end()
  // }

  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => {
      // console.log(error)
      // response.status(400).send({ error: 'malformed id' })
      next(error)
    })
})

// app.get('/info', (request, response) => {
// 	const count = persons.length

// 	response.send(`Phonebook has info for ${count} people. <br/> ${new Date()}`)
// })

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
  // const id = Number(request.params.id)
  // persons = persons.filter(person => person.id !== id)

  // response.status(204).end()
})

// const generateId = () => {
// 	const maxId = persons.length > 0
// 		? Math.max(...persons.map(n => n.id))
// 		: 0

// 	return maxId + 1
// }

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'missing name or number'
    })
  }
  // Person
  // 	.find({})
  // 	.then(result => {
  // 		const alreadyExists = result.filter(person => person.name === body.name)
  // 		if (alreadyExists.length !== 0) {
  // 			const id = alreadyExists[0]._id.toString()

  // 			const { name, number } = request.body

  // 			Person.findByIdAndUpdate(
  // 					id,
  // 					{ name, number },
  // 					{ new: true, runValidators: true, context: 'query' }
  // 				)
  // 				.then(updatedPerson => {
  // 					return response.status(200).json({ updatedPerson })
  // 				})
  // 				.catch(error => next(error))
  // 		} else {
  // 			const person = new Person({
  // 				name: body.name,
  // 				number: body.number,
  // 				// id: generateId()
  // 			})

  // 			person.save().then(savedPerson => {
  // 				response.json(savedPerson)
  // 			})
  // 			.catch(error => next(error))
  // 		}
  // 	})

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => {
      next(error)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      return response.status(200).json({ updatedPerson })
    })
    .catch(error => next(error))
})



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const errorHandler = (error, request, response, next) => {
  console.log(error)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformed id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)