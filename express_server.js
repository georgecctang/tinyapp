const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const randomstring = require('randomstring');

const { isEmailTaken } = require("./helper");

const urlencoded = require("body-parser/lib/types/urlencoded");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const user = {};
let userEmail = '';
let userId = '';

app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET all shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  // Obtain userId from cookie and retrieve email from user object
  userId = req.cookies.user_id;
  // console.log('userId', userId);
  // console.log('user', user[userId]);
  userEmail = userId ? user[userId].email : null;

  // const username = req.cookies['username'];
  const templateVars = { userEmail, urls: urlDatabase };
  res.render("urls_index", templateVars);
})

// GET Input page for user input
app.get("/urls/new", (req, res) => {
  // const username = req.cookies['username'];
  const templateVars = { userEmail };
  res.render("urls_new", templateVars);
})

// GET longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {
  // const username = req.cookies['username'];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { userEmail, shortURL, longURL };
  
  res.render("urls_show", templateVars);
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  
  urlDatabase[shortURL] = updatedURL;

  res.redirect(`/urls/${shortURL}`);
});

// POST user input longURL for shortening
app.post("/urls", (req, res) => {  
  const shortURL = randomstring.generate(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;  
  res.redirect(`/urls/${shortURL}`);
})


app.post("/urls/:shortURL/delete", (req, res) => { 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];  
  res.redirect(`/urls`);
})

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})


// GET redirect to webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.get("/register", (req, res) => {
  const templateVars = { userEmail: null };
  res.render("urls_register", templateVars);
})


app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(404).send('Both email address and password are required.');
  }
  if (isEmailTaken(user, email)) {
    return res.status(404).send('This email address is already associated with an account.');
  }

  const id = randomstring.generate(6);
  
  // Add user to user with id as key
  user[id] = { id, email, password };

  console.log(user);
  // create cookie
  res.cookie('user_id', id);
  res.redirect('/urls');
})

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});