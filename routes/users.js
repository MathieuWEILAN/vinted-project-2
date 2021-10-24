const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    //On vérifie qu'on envoie bien un username
    if (req.fields.username === undefined) {
      res.status(400).json({ message: "Missing parameter(s)" });
    } else {
      const isUserExist = await User.findOne({ email: req.fields.email });
      //On vérifie que l'email en base de données soit bien disponible
      if (isUserExist !== null) {
        res.status(400).json({ message: "This email already has han account" });
      } else {
        //Etape 1 : encrypter le mot de passe
        const salt = uid2(16);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(16);

        //Etape 2 : créer le nouvel utilisateur

        let pictureToUpload = req.files.picture.path;
        const avatar = await cloudinary.uploader.upload(pictureToUpload);

        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
            avatar: avatar,
          },
          token: token,
          hash: hash,
          salt: salt,
        });

        //Etape 3 : sauvegarder ce nouvel utilisateur dans la DB
        await newUser.save();
        res.json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const checkUser = await User.findOne({ email: req.fields.email });
    const newHash = SHA256(req.fields.password + checkUser.salt).toString(
      encBase64
    );
    if (checkUser === null) {
      res.json({ message: "Unauthorized" });
    } else {
      if (checkUser.hash === newHash) {
        res.json({
          id: checkUser.id,
          token: checkUser.token,
          account: checkUser.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
