// Return user_id with email matching the input email
const getUserByEmail = function(email, userDb) {
  for (let id in userDb) {
    if (userDb[id].email === email) {
      return id;
    }
  }
  return undefined;
}

module.exports = { getUserByEmail };