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

const user = {
  "a3dF1x": {
    id: "a3dF1x",
    email: "abc@email.com",
    password: "abc"
  }, 
  "wgSA3F": {
    id: "wgSA3F",
    email: "def@email.com",
    password: "def"
  }
};

let userEmail = '';
let userId = '';

// ------------ GET ------------

// GET Homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET All shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  // Obtain userId from cookie and retrieve email from user object
  userId = req.cookies.user_id;
  // console.log('userId', userId);  
  // console.log('user', user[userId]);
  userEmail = userId ? user[userId].email : null;

  const templateVars = { userEmail, urls: urlDatabase };
  res.render("urls_index", templateVars);
})

// GET Input page for user longURL input
app.get("/urls/new", (req, res) => {
  const templateVars = { userEmail };
  res.render("urls_new", templateVars);
})

// GET Page with longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { userEmail, shortURL, longURL };
  
  res.render("urls_show", templateVars);
})

// GET redirect to longURL webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

// GET User register page
app.get("/register", (req, res) => {
  const templateVars = { userEmail: null };
  res.render("register", templateVars);
})

app.get("/login", (req, res) => {
  const templateVars = { userEmail: null}
  res.render("login", templateVars);
})

// ------------ POST ------------

// POST Update longURL of a shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  
  urlDatabase[shortURL] = updatedURL;

  res.redirect(`/urls/${shortURL}`);
});

// POST User input longURL for creating shortURL
app.post("/urls", (req, res) => {  
  const shortURL = randomstring.generate(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;  
  res.redirect(`/urls/${shortURL}`);
})

// POST: Delete shortURL: longURL data in urlDatabase
app.post("/urls/:shortURL/delete", (req, res) => { 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];  
  res.redirect(`/urls`);
})

// POST User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);
  console.log(user);
  for (let u of Object.values(user)) {
    if (u.email === email) {
      if (u.password === password) {
        res.cookie('user_id', u.id);
        res.redirect('/urls');
      } else {
        res.status(403).send('Incorrect password');
      }
    }
  }

  res.status(403).send('This email address is not associated with an account.');
})

// POST User Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

// POST User register
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  // return error if either email or password is missing
  if (!email || !password) {
    return res.status(404).send('Both email address and password are required.');
  }
  // return error if registration email already exists
  if (isEmailTaken(user, email)) {
    return res.status(404).send('This email address is already associated with an account.');
  }

  // Generate random user id
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

// ------------ LISTEN ------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});