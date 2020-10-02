'use strict';

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");

const randomstring = require('randomstring');
const bcrypt = require('bcrypt');

const { getUserByEmail, authenticateURLAccess } = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['YRajCWKX2M', '2Ia4GWeVj5']
}));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "a3dF1x",
    dateCreated: 'Thu Oct 01 2020 21:47:06 GMT-0400 (Eastern Daylight Time)',
    uniqueVisitCount: 0,
    totalVisitCount: 0 },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "a3dF1x",
    dateCreated: 'Thu Oct 01 2020 21:47:06 GMT-0400 (Eastern Daylight Time)',
    uniqueVisitCount: 0,
    totalVisitCount: 0 }
};

const userDatabase = {
  "a3dF1x": {
    id: "a3dF1x",
    email: "test@email.com",
    password: bcrypt.hashSync('test', 10)
  }
};

// ------------ GET ------------

// GET Homepage
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET All shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  // Obtain userID from cookie
  const userID = req.session.user_id;
  // userID is null if user not logged in; redirect to login page
  if (!userID) {
    return res.redirect('/login');
  }

  let userEmail = userDatabase[userID].email;
  const templateVars = { userID, userEmail, urls: urlDatabase };
  return res.render("urls_index", templateVars);
});

// GET Input page for user longURL input
app.get("/urls/new", (req, res) => {
  // Obtain userID from cookie; redirect to login page if not logged in
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect('/login');
  }
  const userEmail = userDatabase[userID].email;
  res.render("urls_new", { userEmail });
});

// GET Page with longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {

  // authenticate user
  const authenticationStatus = authenticateURLAccess(req, res, urlDatabase);

  // if authenticated, authenticationStatus will be undefined
  // otherwise, set status and send message
  if (authenticationStatus) {
    return res.status(authenticationStatus[0]).send(`<h3>${authenticationStatus[1]}</h3>`)
  }

  // render show page only if user is authenticated
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const userEmail = userDatabase[userID].email;

  const templateVars = { userEmail, shortURL, url: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);

});

// GET User register page
app.get("/register", (req, res) => {
  
  // Direct to url page if already logged in
  const userID = req.session.user_id;

  if (userID) {
    res.redirect('/urls');
  } else {
    res.render("register", { userEmail: null});
  }

});

app.get("/login", (req, res) => {

    // Direct to url page if already logged in
  const userID = req.session.user_id;
  
  if (userID) {
    res.redirect('/urls');
  } else {
    res.render("login", { userEmail: null});
  }
});

// GET redirect to longURL webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  
  let shortURL = req.params.shortURL;
  
  // renders only if shortURL is valid
  if (urlDatabase[shortURL]) {
    // Increase total visit count by 1
    urlDatabase[shortURL].totalVisitCount += 1;

    // Increase uniqueVisitCount only if visited by new vistiors
    // Set cookie with shortURL as key to keep track of repeating visitors
    if (!req.session[shortURL]) {
      req.session[shortURL] = true;
      urlDatabase[shortURL].uniqueVisitCount += 1;
    }

    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    return res.status(404).send('<h3>Error: Invalid URL</h3>');
  }

});

// ------------ POST ------------


// POST post new longURL and create shortURL
app.post("/urls", (req, res) => {

  // Deny request if not logg in
  const userID = req.session.user_id;

  if (!userID) {
    return res.status(403).send('<h3>Access Denied: Please log in.</h3>')
  }

  const longURL = req.body.longURL;

  // Create new random string as short URL
  const shortURL = randomstring.generate(6);

  // Insert current datetime and intialize Total and Unique Visit Counts
  const dateCreated = Date();
  const totalVisitCount = 0;
  const uniqueVisitCount = 0;
  urlDatabase[shortURL] = { longURL, userID, dateCreated, totalVisitCount, uniqueVisitCount };
  res.redirect(`/urls/${shortURL}`);

});

// POST Update longURL of a shortURL
app.post("/urls/:shortURL", (req, res) => {
  // check if user user is logged in
  const authenticationStatus = authenticateURLAccess(req, res, urlDatabase);

  if (authenticationStatus) {
    return res.status(authenticationStatus[0]).send(`<h3>${authenticationStatus[1]}</h3>`)
  }

  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL].longURL = updatedURL;
  res.redirect(`/urls`);
  
});


// POST / DELETE shortURL: longURL data in urlDatabase
app.post("/urls/:shortURL/delete", (req, res) => {

  const authenticationStatus = authenticateURLAccess(req, res, urlDatabase);

  // send error message
  if (authenticationStatus) {
    return res.status(authenticationStatus[0]).send(`<h3>${authenticationStatus[1]}</h3>`)
  }

  // proceed only if authenticationStatus is null
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);

});

// POST User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userID = getUserByEmail(email, userDatabase);
  
  if (userID) {
    // check the match between input and database password
    if (bcrypt.compareSync(password, userDatabase[userID].password)) {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      return res.status(403).send('<h3>Access Denied: Incorrect password</h3>');
    }
  } else {
    return res.status(403).send('<h3>Access Denied: This email address is not associated with an account.</h3>');
  }
});

// POST User Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

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
});

// ERROR Handling

app.get("/:path", (req, res) => {
  res.status(404).send('<h3>Error: Not Found</h3>');
});



// ------------ LISTEN ------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});