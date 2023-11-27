const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initiateDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error is ${error.message}`);
    process.exit(1);
  }
};

initiateDbServer();

const convertStateObj = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const convertDistrictObj = (districtObj) => {
  return {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    population: districtObj.population,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  };
};

app.get("/states/", async (req, resp) => {
  const getStatesQuery = `select * from state;`;
  const stateArray = await db.all(getStatesQuery);
  resp.send(stateArray.map((eachState) => convertStateObj(eachState)));
});

app.get("/states/:stateId/", async (req, resp) => {
  const { stateId } = req.params;
  const getState = `select * from state where state_id=${stateId};`;
  const getStateArray = await db.get(getState);
  resp.send(convertStateObj(getStateArray));
});

app.post("/districts/", async (req, resp) => {
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `insert into district 
    (district_name,state_id,cases,cured,active,deaths)
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const addedArray = await db.run(addDistrict);
  resp.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const getDistrict = `select * from district where district_id=${districtId};`;
  const getDistrictArray = await db.get(getDistrict);
  resp.send(convertDistrictObj(getDistrictArray));
});

app.delete("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const delDistrict = `delete from district where district_id=${districtId};`;
  const delDistrictArray = await db.get(delDistrict);
  resp.send("District Removed");
});

app.put("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `update district set district_name='${districtName}',
                    state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} 
                    where district_id=${districtId};`;
  const updatedArray = await db.run(updateQuery);
  resp.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, resp) => {
  const { stateId } = req.params;
  const getStats = `select sum(cases),sum(cured),sum(active),sum(deaths) from district where state_id=${stateId};`;
  const getStatsArray = await db.get(getStats);
  resp.send({
    totalCases: getStatsArray["sum(cases)"],
    totalCured: getStatsArray["sum(cured)"],
    totalActive: getStatsArray["sum(active)"],
    totalDeaths: getStatsArray["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (req, resp) => {
  const { districtId } = req.params;
  const getDistrictDetails = `select state_id from district where district_id=${districtId};`;
  const getDistrictDetailsArray = await db.get(getDistrictDetails);
  const stateNameQuery = `select state_name as stateName from state
  where state_id=${getDistrictDetailsArray.state_id};`;
  const getStateName = await db.get(stateNameQuery);
  resp.send(getStateName);
});

module.exports = app;
