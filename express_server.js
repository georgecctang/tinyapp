'use strict';

const express = require("express");
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

const randomstring = require('randomstring');
const bcrypt = require('bcrypt');

const { getUserByEmail, checkLogin, authenticateURLAccess } = require("./helpers");

const urlencoded = require("body-parser/lib/types/urlencoded");
const app = express();
const PORT = 8080; // default port 8080


app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['YRajCWKX2M', '2Ia4GWeVj5']
}));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "a3dF1x", dateCreated: '1/1/2020' }, 
  "9sm5xK": { longURL: "http://www.google.com", userID: "a3dF1x", dateCreated: '1/2/2020'},
  "asD32b": { longURL: "http://www.cnn.com", userID: "wgSA3F", dateCreated: '1/3/2020' },
  "qfDa15": { longURL: "http://www.espn.com", userID: "wgSA3F", dateCreated: '1/4/2020' }
};

const userDatabase = {
  "a3dF1x": {
    id: "a3dF1x",
    email: "aaa@email.com",
    password: bcrypt.hashSync('aaa', 10)
  }, 
  "wgSA3F": {
    id: "wgSA3F",
    email: "bbb@email.com",
    password: bcrypt.hashSync('bbb', 10)
  }
};

// ------------ GET ------------

// GET Homepage
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET All shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  // Obtain userID from cookie and retrieve email from user object
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect('/login');
  };
  let userEmail = userDatabase[userID].email;
  const templateVars = { userID, userEmail, urls: urlDatabase };
  return res.render("urls_index", templateVars);
})

// GET Input page for user longURL input
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect('/login');
  }
  const userEmail = userDatabase[userID].email;
  const templateVars = { userEmail };
  res.render("urls_new", templateVars);
})

// GET Page with longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {

  // check if user user is logged in
  const isLogin = checkLogin(req, res);
  let isAuthenticated; 

  // authenticate URL access only if user is logged in
  if (isLogin === true) {
    isAuthenticated = authenticateURLAccess(req, res, urlDatabase);
  }

  // render show page only if user is logged in 
  if (isLogin === true && isAuthenticated === true) {
    const userID = req.session.user_id;
    const shortURL = req.params.shortURL;
    const userEmail = userDatabase[userID].email;
    const longURL = urlDatabase[shortURL].longURL;
    const templateVars = { userEmail, shortURL, longURL };
    res.render("urls_show", templateVars);
  } else {
    return;
  }
})

// GET User register page
app.get("/register", (req, res) => {
  const templateVars = { userEmail: null };
  res.render("register", templateVars);
})

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
  } else {
    res.render("login", { userEmail: null});
  }
})

// GET redirect to longURL webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
})

// ------------ POST ------------


// POST post new longURL and create shortURL
app.post("/urls", (req, res) => {  
  // Deny request if user not logged in  
  const isLogin = checkLogin(req, res);

  // Create new random string as short URL
  if (isLogin === true) {
    const userID = req.session.user_id;
    const shortURL = randomstring.generate(6);
    const longURL = req.body.longURL;
    const dateCreated = Date();
    urlDatabase[shortURL] = { longURL, userID, dateCreated };
    res.redirect(`/urls/${shortURL}`);
  } else {
    return;
  }

})

// POST Update longURL of a shortURL
app.post("/urls/:shortURL", (req, res) => {
  // check if user user is logged in
  const isLogin = checkLogin(req, res);
  let isAuthenticated; 

  // authenticate URL access only if user is logged in
  if (isLogin === true) {
    isAuthenticated = authenticateURLAccess(req, res, urlDatabase);
  }

  if (isLogin === true && isAuthenticated === true) {
    const shortURL = req.params.shortURL;
    const updatedURL = req.body.updatedURL;
    urlDatabase[shortURL].longURL = updatedURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    return;
  }
});


// POST / DELETE shortURL: longURL data in urlDatabase
app.post("/urls/:shortURL/delete", (req, res) => { 

  // check if user user is logged in
  const isLogin = checkLogin(req, res);
  let isAuthenticated; 

  // authenticate URL access only if user is logged in
  if (isLogin === true) {
    isAuthenticated = authenticateURLAccess(req, res, urlDatabase);
  }


  if (isLogin === true && isAuthenticated === true) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];  
    res.redirect(`/urls`);
  } else {
    return;
  }
})

// POST User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userID = getUserByEmail(email, userDatabase); 
  if (userID) {
    if (bcrypt.compareSync(password, userDatabase[userID].password)) {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      return res.status(403).send('<h3>Error: Incorrect password</h3>');
    }
  } else {
    return res.status(403).send('<h3>Error: This email address is not associated with an account.</h3>');
  }
});

// POST User Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
})

// POST User register
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  // return error if either email or password is missing
  if (!email || !password) {
    return res.status(404).send('<h3>Error: Both email address and password are required.</h3>');
  }
  // return error if registration email already exists
  if (getUserByEmail(email, userDatabase)) {
    return res.status(404).send('<h3>Error: This email address is already associated with an account.</h3>');
  }

  // Generate random user id
  const id = randomstring.generate(6);
  
  // Generate hashed password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Add user to user with id as key
  userDatabase[id] = { id, email, password: hashedPassword };

  // create cookie
  req.session.user_id = id;
  res.redirect('/urls');
})

// ERROR Handling

app.get("/:path", (req, res) => {
  res.status(404).send('<h3>Error: Not Found</h3>');
})



// ------------ LISTEN ------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});