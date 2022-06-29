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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};


const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

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

app.get("/urls/:shortURL", (req, res) => {
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

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

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
});

app.post("/logout", (req, res) => {
  
  req.session = null;
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  const templateVars = { user: users[ req.session.user_id] };

  res.render("register", templateVars);
});

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



  res.cookie("user_id", users[id]);
  res.redirect('/urls');
});


app.get("/login", (req, res) => {

  const templateVars = {
    user: users[ req.session.user_id],
  };
  res.render("new-login", templateVars);
})