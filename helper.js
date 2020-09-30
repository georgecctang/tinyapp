const isEmailTaken = function(userDb, registerEmail) {
  for (let user of Object.values(userDb)) {
    if (user.email === registerEmail) {
      return true;
    }
  }
  return false;
}

module.exports = { isEmailTaken };