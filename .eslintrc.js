module.exports = {
  "extends": "airbnb",
  "plugins": [
    "react"
  ],

  // Sketchpack overrides from AirBNB
  "rules": {

    // These are sketches.  Console debugging is okay.
    "no-console": 0,

    // disagreements with airbnb:
    "func-names": 0,
    "prefer-arrow-callback": 0,
    "no-shadow": 0,
    "consistent-return": 0,
    "prefer-const": 0,
  }
};