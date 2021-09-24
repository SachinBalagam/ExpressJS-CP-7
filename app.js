const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 1 get list of players

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const players = await db.all(getPlayersQuery);
  response.send(
    players.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 2 Get specific player based on player_id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

// API 3 Update Player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details 
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  const updatedPlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 Get Match Details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDbObjectToResponseObject(matchDetails));
});

// API 5 Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetails = `
    SELECT * FROM player_match_score 
      NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const details = await db.all(getMatchDetails);
  response.send(
    details.map((eachMatch) => convertMatchDbObjectToResponseObject(eachMatch))
  );
});

// API 6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT * FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId};`;
  const matchDetails = await db.all(getMatchPlayersQuery);
  response.send(
    matchDetails.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// API 7 Returns the statistics of the total score, fours, sixes
// of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayer = `
    SELECT 
        player_id AS playerId, 
        player_name AS playerName, 
        SUM(score) AS totalScore, 
        SUM(fours) AS totalFours, 
        SUM(sixes) As totalSixes
    FROM player_match_score 
        NATURAL JOIN player_details 
    WHERE 
        player_id = ${playerId};`;
  const details = await db.get(getStatsOfPlayer);
  response.send(details);
});

module.exports = app;
