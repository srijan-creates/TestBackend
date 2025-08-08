const { verifyJWT } = require("../utils/generateToken");

const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  // console.log("verify User middleware", token);
  if (!token)
    return res.status(400).json({ success: false, message: "Please sign in" });
  try {
    let user = await verifyJWT(token);
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Please sign in" });
    req.user = user.id;
    // console.log("User verified:", req.user);
    next();
  } catch (error) {}
};
module.exports = verifyUser;
