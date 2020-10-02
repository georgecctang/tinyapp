// Return user_id with email matching the input email
const getUserByEmail = function(email, userDb) {
  for (let id in userDb) {
    if (userDb[id].email === email) {
      return id;
    }
  }
  return undefined;
};


// Check if the shortURL path is valid, and if the user has access
// Returns status code and message if user is not authenticated
// Returns undefined if user is logged in an have access to the shortURL

const authenticateURLAccess = function(req, res, urlDb) {
  const userID = req.session.user_id;
  
  if (!req.session.user_id) {
    return [403, 'Access Denied: Please log in.'];
  }
  
  const shortURL = req.params.shortURL;

  // check if shortURL exists
  if (!urlDb[shortURL]) {
    return [404, 'Error: This URL does not exist.'];
  }

  // check if the user has access to this URL
  if (urlDb[shortURL].userID !== userID) {
    return [403, 'Access denied: You do not have access to this URL.'];
  }

  return;
};

module.exports = { getUserByEmail, authenticateURLAccess };
