const fetch = require("node-fetch");

const API_URL = "https://webtich.asisa.es:9088/api/v2";
const API_URL_DOCTORS =
  "https://webtich.asisa.es:9091/api/apphla/obtenermedicos";
const API_URL_HOSPITALS = "https://api.grupohla.com/api/v1/hospitals";
const headers = {
  Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6Ilt7IFwiQUNDRVNPXCI6XCJBU0lTQVwiIH1dIiwibmJmIjoxNTQ5NjIyMTYwLCJleHAiOjE1NDk2MjM5NjAsImlhdCI6MTU0OTYyMjE2MCwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo2MTUyMyIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NjE1MjMifQ.Pua_CEcNqGDwY_7YffDPfeHIyIxQCw-7RX7naPD-YE8`,
  "Content-Type": "application/json",
};

const getCountries = async () => {
  const response = await fetch(`${API_URL}/countries`, { headers });
  const countries = await response.json();

  return countries;
};

const getRegions = async (req, res) => {
  const totalRegions = [];
  const response = await fetch(`${API_URL}/regions?country_id=724`, {
    headers,
  });
  const regions = await response.json();
  regions.map((region) => {
    totalRegions.push(region);
  });

  return totalRegions;
};

const getProvinces = async (req, res) => {
  const countries = await getCountries();
  const regions = await getRegions();

  const regionsId = regions.map((region) => region.id);

  const provincesId = [];
  const totalProvinces = [];
  for (let index = 0; index < regionsId.length; index++) {
    const regionId = regionsId[index];
    const response = await fetch(
      `${API_URL}/provinces?country_id=724&region_id=${regionId}`,
      { headers }
    );
    const provinces = await response.json();
    console.log({ provinces });
    provinces.map((province) => {
      totalProvinces.push(province);
      provincesId.push(province.id);
    });
  }

  res.json({ countries, regions, provinces: totalProvinces });
};

const getDoctors = async () => {
  const response = await fetch(API_URL_DOCTORS, { headers: headers });
  return await response.json();
};

const getHospitalsLocations = async () => {
  const response = await fetch(API_URL_HOSPITALS);
  return await response.json();
};

const createDoctors = async (body) => {
  return await fetch(
    "https://staging-hlacms.kinsta.cloud/wp-json/wp/v2/medico",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64.encode(
          "restapiclient:bVob i6Kg bzFG OF5c dodr jEmy"
        )}`,
        "Content-Type": "application/json",
      },
      body,
    }
  );
};

const migrateDoctors = async (req, res) => {
  const { limit, page } = req.query;
  const finalResponse = [];
  const doctors = await getDoctors();

  if (doctors.length > 0) {
    const hospitals = await getHospitalsLocations();
    for (let index = 0; index < limit; index++) {
      const doctorCode = doctors[index].CODIGO;
      const codes = [];

      doctors
        .map((doctor) => doctor.CODIGO === doctorCode && doctor.CODCENTRO)
        .filter((code) => code !== false)
        .forEach((el) => {
          if (!codes.includes(el)) {
            codes.push(el);
          }
        });

      const cities = [];

      hospitals
        .map((hospital) => codes.includes(hospital.code) && hospital.city)
        .filter((hospital) => hospital !== false)
        .forEach((el) => {
          if (!cities.includes(el)) {
            cities.push(el);
          }
        });

      const ids = [];

      finalResponse.forEach((el) => {
        if (!ids.includes(el)) {
          ids.push(el.entityFields.fieldInternalID);
        }
      });

      if (!ids.includes(doctors[index].CODIGO)) {
        const body = {
          title:
            doctors[index].NOMBRE +
            " " +
            doctors[index].APELLIDO1.replace(".", "") +
            " " +
            doctors[index].APELLIDO2.replace(".", ""),
          content: doctors[index].DESCRIPCIONWEB,
          status: "publish",
          entityFields: {
            /*  fieldPhoneNumber: "+34 500 7000",*/
            fieldAddressCountry: "España",
            fieldAddressProvince: cities.join(" | "),
            fieldInternalID: doctors[index].CODIGO,
            fieldNif: doctors[index].NIF,
            fieldServices: doctors[index].ESPECIALIDAD,
            fieldAllowsOnlineAppointment: doctors[index].CITAONLINE,
            fieldCenters: codes.join(","),
            fieldExtFeaturedImage: doctors[index].URLIMAGE,
          },
        };

        try {
          //const doctor = await createDoctors(body);
          finalResponse.push(body);
        } catch (error) {
          console.log({ error });
        }
      }
    }

    console.log({ finalResponse });
  }
  res.json(finalResponse);
};

module.exports = {
  getCountries,
  getRegions,
  getProvinces,
  migrateDoctors,
};
