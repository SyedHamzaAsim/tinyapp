const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

const urlsForUser = function(userId, urlDatabase) {
  let userdata = {};
  for (let url in urlDatabase) {  
    if (urlDatabase[url].userID === userId) {
      userdata[url] = urlDatabase[url]
    }
  }
  return userdata;
}


function generateRandomString() {
  const result = Math.random().toString(36).substring(2, 8);
  return result;
}


module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
}