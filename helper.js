const getUserWithEmail = function(userDb, email) {
  for (let user of Object.values(userDb)) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

module.exports = { getUserWithEmail };