'use strict';

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const randomstring = require('randomstring');

const { getUserWithEmail } = require("./helper");

const urlencoded = require("body-parser/lib/types/urlencoded");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "a3dF1x" }, 
  "9sm5xK": { longURL: "http://www.google.com", userID: "a3dF1x"},
  "asD32b": { longURL: "http://www.cnn.com", userID: "wgSA3F"},
  "qfDa15": { longURL: "http://www.espn.com", userID: "wgSA3F"}
};

const userDatabase = {
  "a3dF1x": {
    id: "a3dF1x",
    email: "aaa@email.com",
    password: "aaa"
  }, 
  "wgSA3F": {
    id: "wgSA3F",
    email: "bbb@email.com",
    password: "bbb"
  }
};


// ------------ GET ------------

// GET Homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET All shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  // Obtain userID from cookie and retrieve email from user object
  const userID = req.cookies.user_id;
  if (!userID) {
    res.redirect('/login');
  }
  // console.log('userID', userID);  
  // console.log('user', userDatabase[userID]);
  let userEmail = userDatabase[userID].email;
  const templateVars = { userID, userEmail, urls: urlDatabase };
  console.log(userID, userEmail);
  res.render("urls_index", templateVars);
})

// GET Input page for user longURL input
app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    res.redirect('/login');
  }
  const userEmail = userDatabase[userID].email;
  const templateVars = { userEmail };
  res.render("urls_new", templateVars);
})

// GET Page with longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies.user_id;
  if (!userID) {
    res.redirect('/login');
  }
  const userEmail = userDatabase[userID].email;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { userEmail, shortURL, longURL };
  console.log('get', templateVars);
  res.render("urls_show", templateVars);
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

// GET redirect to longURL webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
})

// ------------ POST ------------


// POST User post new longURL and create shortURL
app.post("/urls", (req, res) => {  
  const userID = req.cookies.user_id;
  const shortURL = randomstring.generate(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
})

// POST Update longURL of a shortURL
app.post("/urls/:shortURL", (req, res) => {
  console.log('req.body', req.body);

  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL].longURL = updatedURL;
  console.log('updating url...');  
  console.log('post', urlDatabase[shortURL]);
  // res.redirect(`/urls/${shortURL}`);
  res.redirect(`/urls/${shortURL}`);
});


// POST / DELETE shortURL: longURL data in urlDatabase
app.post("/urls/:shortURL/delete", (req, res) => { 
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];  
  res.redirect(`/urls`);
})

// POST User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);
  let user = getUserWithEmail(userDatabase, email); 

  if (user) {
    if (user.password === password) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    } else {
      res.status(403).send('Incorrect password');
    }
  } else {
    res.status(403).send('This email address is not associated with an account.');
  }
});

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
  if (getUserWithEmail(userDatabase, email)) {
    return res.status(404).send('This email address is already associated with an account.');
  }

  // Generate random user id
  const id = randomstring.generate(6);
  
  // Add user to user with id as key
  userDatabase[id] = { id, email, password };

  // console.log(user);
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