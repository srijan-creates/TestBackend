const jwt = require("jsonwebtoken");

async function generateJWT(payload) {
  let token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn});
  return token;
}
async function verifyJWT(token) {
  try {
    let data = await jwt.verify(token, process.env.JWT_SECRET);
    return data;
  } catch (error) {
    return false;
  }
}
async function decodeJWT(token) {
  try {
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return false;
  }
}
module.exports = { generateJWT, verifyJWT, decodeJWT };
