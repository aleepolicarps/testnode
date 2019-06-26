const express = require('express')
const session = require('express-session')
const app = express()
const port = 3000
const models = require('./models.js')

app.set('view engine', 'pug')
app.use(session({
  secret: 'meh',
  resave: false,
  saveUninitialized: true
}))
app.use(express.json())
app.use(express.urlencoded())

app.get('/',  (req, res) => {
    if(!req.session.user) {
      res.redirect('/login')
    }

    models.User.findAll().then(users => {
      res.render('index', {
        users: users,
        currUser: req.session.user
      });
    });
})

app.get('/logout',  (req, res) => {
  if(req.session.user) {
    delete req.session.user
  }
  res.redirect('login')
})

app.get('/login',  (req, res) => {
  if(req.session.user) {
    res.redirect('/')
  }

  res.render('login')
})

app.post('/login',  (req, res) => {
  models.User.findAll({
    where: {
      email: req.body.email,
      password: req.body.password
    }
  }).then(users => {
    let user = users[0];
    if(user) {
      req.session.user = user
      user.update({loggedIn: true});
      res.redirect('/')
    } else {
      res.render('login', {error: 'Authentication failed'})
    }
  })
})

app.get('/signup',  (req, res) => {
  if(req.session.user) {
    res.redirect('/')
  }

  res.render('signup')
})

app.post('/signup',  (req, res) => {
  const User = models.User
  User.sync().then(() => {
    return User.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password
    })
  }).then(newUser => {
    if(newUser) {
      res.redirect('/login')
    }
  }).catch(() => {
    res.render('signup', {error: 'Signup failed. Try again.'})
  })
})

app.get('/update/:id', (req, res) => {
  if(!req.session.user) {
    res.redirect('/login')
  }

  models.User.findAll({where: {id: req.params.id}}).then(users => {
    let user = users[0];
    res.render('update_user', {user: user, currUser: req.session.user});
  })
});

app.post('/update/:id', (req, res) => {
  if(!req.session.user) {
    res.redirect('/login')
  }

  models.User.update({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    password: req.body.password,
    isAdmin: req.body.isAdmin || false,
  }, {where: {id: req.params.id}}).then(() => {
    res.redirect('/');
  });
});

// to create admin
app.get('/set-admin/secret/:email', (req, res) => {
  models.User.update({isAdmin:true}, {where: {email: req.params.email}})
  res.send('ok');
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
