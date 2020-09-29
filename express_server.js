const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
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

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';
  // Fix lenght to 6
  for (let i = 0; i < 6; i++) {
     result += characters[Math.floor(Math.random() * charactersLength)];
  }
  return result;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET all shortURL - longURL pairs in urlDatabase
app.get("/urls", (req, res) => {
  const username = req.cookies['username'];
  const templateVars = { username, urls: urlDatabase };
  res.render("urls_index", templateVars);
})

// GET Input page for user input
app.get("/urls/new", (req, res) => {
  const username = req.cookies['username'];
  const templateVars = { username };
  res.render("urls_new", templateVars);
})

// GET longURL based on shortURL param input
app.get("/urls/:shortURL", (req, res) => {
  const username = req.cookies['username'];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { username, shortURL, longURL };
  
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
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;  
  res.redirect(`/urls/${shortURL}`);
})


app.post("/urls/:shortURL/delete", (req, res) => { 
  console.log('delet url...'); 
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
  res.clearCookie("username");
  res.redirect("/urls");
})


// GET redirect to webpage based on shortURL param input
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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