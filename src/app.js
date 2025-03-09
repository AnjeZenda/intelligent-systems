const Agent = require('./agent');
const Socket = require('./socket');
const Manager = require("./manager");
const dt2 = require("./player_dt");
const goal_keep_dt = require("./goal_keeper_dt");
const VERSION = 7;


(async () => {
	let teamA = "A";
	let teamB = "B";
    let player1 = new Agent(teamA);
    player1.dt = dt2;
    player1.manager = new Manager();

    let player2 = new Agent(teamA);
    player2.dt = dt2;
    player2.manager = new Manager();

    let goalKeeper = new Agent(teamB);
    goalKeeper.dt = goal_keep_dt;
    goalKeeper.manager = new Manager();
    goalKeeper.goalie = true;

    await Socket(player1, teamA, VERSION);
    await Socket(player2, teamA, VERSION);
    await Socket(goalKeeper, teamB, VERSION, true);

    await player1.socketSend('move', '-15 -5');
    await player2.socketSend('move', '-14 4');
    await goalKeeper.socketSend('move', "-20 0");    
})();
