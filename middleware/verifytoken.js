const jwt = require("jsonwebtoken");
const Users = require('../models/users.model');
const auth = async (req, res, next) => {
  let token = req.header("Authorization");
  token = token.replace(/^Bearer\s+/, "");
  if (!token) {
    return res.status(401).send({ err: "Token is expired" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
    const user = await Users.findOne({_id: decoded.userId});
    // console.log(user)
    if (user) {
      req.user = user;
    } else {
      res.status(400).send({ err: "Invalid Token" });
    }
    next();
  } catch (err) {
    res.status(400).send({ err: "Invalid Token" });
  }
};

module.exports = auth;
