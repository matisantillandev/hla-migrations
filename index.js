const express = require("express");
const base64 = require("base-64");
const {
  getCountries,
  getRegions,
  getProvinces,
  migrateDoctors,
} = require("./controllers");

const app = express();
const port = 3001;

app.get("/doctors", migrateDoctors);

app.get("/locations", getProvinces);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
