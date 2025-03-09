const Agent = require('./agent');
const Socket = require('./socket');
const Manager = require("./manager");
const dt1 = require("./goal_scorer_dt");
const dt2 = require("./assist_player_dt");
const VERSION = 7;


(async () => {
	let teamA = "A";
	let teamB = "B";
    let player1 = new Agent(teamA);
    player1.dt = dt2;
	player1.playerName = "assistant"
    player1.manager = new Manager();

    let player2 = new Agent(teamA);
    player2.dt = dt1;
	player2.playerName = "scorer"
    player2.manager = new Manager();

    // let goalKeeper = new Agent(teamB);
    // goalKeeper.dt = goal_keep_dt;
    // goalKeeper.manager = new Manager();
    // goalKeeper.goalie = true;

    await Socket(player1, teamA, VERSION);
    await Socket(player2, teamA, VERSION);
    // await Socket(goalKeeper, teamB, VERSION, true);

	let npc1 = new Agent("B");
    let npc2 = new Agent("B");
	await Socket(npc1, 'B', VERSION);
    await Socket(npc2, 'B', VERSION);

    await player1.socketSend('move', '-20 0');
    await player2.socketSend('move', '-20 20');
    // await goalKeeper.socketSend('move', "-20 0");    

    await npc1.socketSend('move', `-57.5 -38`);
    await npc2.socketSend('move', `-57.5 38`);  
})();
