const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const { cookie } = require("request");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
app.use(cookieParser());


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}

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

const urlsForUser = function(userId) {
  let userdata = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userId) {
      userdata[url] = urlDatabase[url]
    }
  }
}
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

 ;

  if (req.cookies.user_id == null){
    res.redirect('/login');
  };

  const cookieUser= req.cookies.user_id;

  const templateVars = {urls: urlsForUser(cookieUser), user: users[cookieUser]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  if (!users[req.cookies['user_id']]) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
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
    if (bcrypt.compareSync(req.body.password, user['password'])) {
      res.cookie('user_id', user['id']);
      res.redirect('/urls');
    } else {
      res.status(403).send('wrong password');
    }
  } else {
    res.status(403).send('user no existo');
  }
});

app.post("/logout", (req, res) => {
  
  res.clearCookie("user_id")
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };

  res.render("register", templateVars);
});

const findEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

app.post('/register', (req, res) => {

  let id = generateRandomString();

  if (!req.body.email || !req.body.password) {
    return res.status(401).send("Empty user and/or password")
  }

  if (findEmail(req.body.email, users)) {
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
    user: users[req.cookies.user_id],
  };
  res.render("new-login", templateVars);
})