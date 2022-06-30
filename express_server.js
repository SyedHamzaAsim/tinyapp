const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');

const {
  getUserByEmail,
  urlsForUser,
  generateRandomString
} = require ('./helpers')


app.use(cookieSession({
  name: 'session',
  keys: ['key0', 'key1'],
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
};

const users = {};

//landing page: redirects to /urls
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//urls page, checks if user is logged in, and displays the urls belonging to that user
app.get("/urls", (req, res) => {

  let user_id = req.session.user_id;
  if (!user_id) {
    return res.redirect('/login')
  }

  const userUrls =  urlsForUser(req.session.user_id, urlDatabase);

  const templateVars = {
    user: users[req.session.user_id],
    urls: userUrls
  };
  return res.render("urls_index", templateVars);
});

//new url page, redirects if not logged in, otherwise lets you create a new shortened url
app.get("/urls/new", (req, res) => {

  if (!users[req.session['user_id']]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[ req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

//edit page, made it so you can't edit through a command line if not logged in
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('error, nothin here');
  }

  if (!users[ req.session.user_id]) {
    return res.status(403).send('error, not logged in');
  }

  if (!(urlDatabase[shortURL].userID === users[req.session.user_id].id)) {
    return res.status(403).send('Nice try lol');
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

//just redirects you to the actual page for the shortened url
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//always accessible, register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[ req.session.user_id] };

  res.render("register", templateVars);
});

//login page kinda straightforward
app.get("/login", (req, res) => {

  const templateVars = {
    user: users[ req.session.user_id],
  };
  res.render("new-login", templateVars);
})


app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let shortURL = generateRandomString()
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    }
    return res.redirect(`/urls`)
  } else {
    res.redirect('/login');
  }
});

// delete, now not accessible through command line
app.post('/urls/:shortURL/delete', (req, res) => {

  if (!users[ req.session.user_id]) {
    return res.status(403).send("Access denied");
  }

  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`)
});


app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.editURL,
    userID: req.session.user_id,
  };
  res.redirect('/urls')
});

//login attempt. user needs to be registered.
app.post('/login', (req, res) => {

  const user = getUserByEmail(req.body.email, users);

  if (user) {
    if (bcrypt.compareSync(req.body.password, user['password'])) {
      req.session.user_id =  user['id'];
      res.redirect('/urls');
    } else {
      res.status(403).send('wrong password');
    }
  } else {
    res.status(403).send('user no existo');
  }
})

//logout
app.post("/logout", (req, res) => {
  
  req.session = null;
  res.redirect("/urls");
})



//register attempt, email and password need to be entered, email cannot be a duplicate of another account
app.post('/register', (req, res) => {

  let id = generateRandomString();

  if (!req.body.email || !req.body.password) {
    return res.status(401).send("Empty user and/or password")
  }

  if (getUserByEmail(req.body.email, users)) {
    return res.status(409).send("Email already exists")
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  users[id] = {};
  users[id]['email'] = req.body.email;
  users[id]['password'] = hashedPassword;
  users[id]['id'] = id;

  req.session.user_id =  users[id]['id'];
  res.redirect('/urls');
});