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
    if (user.permision === 2) res.status(400).send({ err: "expired free trial." });
    trial = 15 - parseInt((Date.now() - user.created_at)/86400000);
    if (user.permision === 0 && trial < 1) {
      user.permision = 2;
      users.save();
      res.status(400).send({ err: "expired free trial." });
    }
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
