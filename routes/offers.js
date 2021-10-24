const express = require("express");
const { ConnectionStates } = require("mongoose");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Offer = require("../models/Offer");

const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: req.user,
    });

    let pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `vinted/offers/${newOffer.id}`,
    });
    newOffer.product_image = result;
    await newOffer.save();
    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/offer/put", isAuthenticated, async (req, res) => {
  try {
    const offerToModifie = await Offer.findById(req.fields.id);
    console.log(offerToModifie);
    if (!offerToModifie) {
      res.status(400).json({ message: "Offer not found" });
    } else {
      if (req.fields.product_title) {
        offerToModifie.product_name = req.fields.product_title;
      }
      if (req.fields.product_price) {
        offerToModifie.product_price = req.fields.product_price;
      }
      if (req.fields.product_description) {
        offerToModifie.product_description = req.fields.product_description;
      }
      if (req.fields.product_brand) {
        offerToModifie.product_details[0] = {
          MARQUE: req.fields.product_brand,
        };
      }
      if (req.fields.product_size) {
        offerToModifie.product_details[1] = {
          TAILLE: req.fields.product_size,
        };
      }
      if (req.fields.product_condition) {
        offerToModifie.product_details[2] = {
          ETAT: req.fields.product_condition,
        };
      }
      if (req.fields.product_color) {
        offerToModifie.product_details[3] = {
          COULEUR: req.fields.product_color,
        };
      }
      if (req.fields.product_city) {
        offerToModifie.product_details[4] = {
          EMPLACEMENT: req.fields.product_city,
        };
      }
      await offerToModifie.save();
      res.json({ message: "Offer is modified" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    if (req.fields.id) {
      await Offer.findByIdAndDelete(req.fields.id);
      res.json({ message: "Deleted" });
    } else {
      res.json({ message: "Offer not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    let filter = {};
    if (req.query.title) {
      filter.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin && !req.query.priceMax) {
      filter.product_price = { $gte: req.query.priceMin };
    } else if (req.query.priceMax && !req.query.priceMin) {
      filter.product_price = { $lte: req.query.priceMax };
    } else if (req.query.priceMax && req.query.priceMin) {
      filter.product_price = {
        $gte: req.query.priceMin,
        $lte: req.query.priceMax,
      };
    }

    let sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1;
    }
    const limit = 2;
    let page = 1;

    const count = await Offer.countDocuments(filter);

    if (req.query.page) {
      page = limit * (req.query.page - 1);
      const checkProducts = await Offer.find(filter)
        .select("product_name product_price")
        .sort(sort)
        .skip(page)
        .limit(limit);
      res.json({ count: count, offers: checkProducts });
    } else {
      page = 1;
      const checkProducts = await Offer.find(filter)
        .select("product_name product_price")
        .sort(sort)
        .skip(page)
        .limit(limit);
      res.json({ count: count, offers: checkProducts });
    }
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "account",
    });
    if (offer) {
      res.json(offer);
    } else {
      res.status(400).json({ message: "Offer not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
