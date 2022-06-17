const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const { cookie } = require("request");
const cookieParser = require("cookie-parser");
app.use(cookieParser());


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: req.params.longURL, user: users[req.cookies.user_id]};
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`)
}); 

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.editURL;
  res.redirect('/urls') 
});

app.post('/login', (req, res) => {

  const user = findEmail(req.body.email, users);

  if (user) {
    if (req.body.password == user['password']) {
      res.cookie('user_id', user['id']);
      res.redirect('/urls');
    } else {
      res.status(403).send('wrong password');
    }
  } else {
    res.status(403).send('user no existo');
  }
});

app.get("/logout", (req, res) => {
  req.cookies.user_id = null;
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  res.render("register", templateVars);
});

const findEmail = (email, users) => {
  for(let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

app.post('/register',(req, res) => {
  console.log(users);
  console.log(req.body);

  let id = generateRandomString();

  if (!req.body.email || !req.body.password) {
    return res.status(401).send("Empty user and/or password")
  }

  if (findEmail(req.body.email, users)) {
    return res.status(409).send("Email already exists")
  }

  users[id] = {};
  users[id]['email'] = req.body.email;
  users[id]['password'] = req.body.password;
  users[id]['id'] = id;



  res.cookie("user_id", users[id]);
  res.redirect('/urls');
});


app.get("/login", (req, res) => {

  const templateVars = {
    user: users[req.cookies.user_id],
  };
  res.render("new-login", templateVars);
})