// Return user_id with email matching the input email
const getUserByEmail = function(email, userDb) {
  for (let id in userDb) {
    if (userDb[id].email === email) {
      return id;
    }
  }
  return undefined;
}

// Check if user is logged in

const checkLogin = function(req, res) {
  const userID = req.session.user_id;
  // Send error message if not logged in
  if (!userID) {
    return res.status(403).send('Access denied: Please log in.');
  }
  return true;
}

// Check if the shortURL path is valid, and if the user has access

const authenticateURLAccess = function(req, res, urlDb) {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  // check if shortURL exists
  if (!urlDb[shortURL]) {
    return res.status(403).send('Error: This URL does not exist.');
  }

  // check if the user has access to this URL
  if (urlDb[shortURL].userID !== userID) {
    return res.status(403).send('Access denied: You do not have access to this URL.')
  }

  return true;
}

module.exports = { getUserByEmail, checkLogin, authenticateURLAccess };
