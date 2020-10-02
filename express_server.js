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
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "a3dF1x", 
    dateCreated: '1/1/2020',
    uniqueVisitCount: 0, 
    totalVisitCount: 0 }, 
  "9sm5xK": { 
    longURL: "http://www.google.com", 
    userID: "a3dF1x", 
    dateCreated: '1/2/2020',
    uniqueVisitCount: 0,
    totalVisitCount: 0 }
};

const userDatabase = {
  "a3dF1x": {
    id: "a3dF1x",
    email: "aaa@email.com",
    password: bcrypt.hashSync('aaa', 10)
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

  // render show page only if user is logged in and authenticated
  if (isLogin === true && isAuthenticated === true) {
    const userID = req.session.user_id;
    const shortURL = req.params.shortURL;
    const userEmail = userDatabase[userID].email;
    const longURL = urlDatabase[shortURL].longURL;
    const totalVisitCount = urlDatabase[shortURL].totalVisitCount;
    const uniqueVisitCount = urlDatabase[shortURL].uniqueVisitCount;
    const templateVars = { userEmail, shortURL, longURL, totalVisitCount, uniqueVisitCount };
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

})

// ------------ POST ------------


// POST post new longURL and create shortURL
app.post("/urls", (req, res) => {  
  // Deny request if user not logged in  
  const isLogin = checkLogin(req, res);

  if (isLogin === true) {
    const userID = req.session.user_id;
    // Create new random string as short URL
    const shortURL = randomstring.generate(6);

    const longURL = req.body.longURL;
    const dateCreated = Date();
    const totalVisitCount = 0;
    const uniqueVisitCount = 0;
    urlDatabase[shortURL] = { longURL, userID, dateCreated, totalVisitCount, uniqueVisitCount };
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