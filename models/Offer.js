const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, require: true, maxLength: 50 },
  product_description: { type: String, require: true, maxLength: 500 },
  product_price: { type: Number, require: true, min: 0.01, max: 100000 },
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
