const utils = require("./calculations");

class Manager{

	getAction(dt, p, cmd){
		function execute(dt, title, p, cmd){
			const action = dt[title];
			//console.log(title);

			if (typeof action.exec == "function"){
				action.exec(Manager, dt.state, p, cmd);
				return execute(dt, action.next, p, cmd);
			}
			if (typeof action.condition == "function"){
				const cond = action.condition(Manager, dt.state, p, cmd);
				if (cond){
					return execute(dt, action.trueCond, p, cmd);
				}
				return execute(dt, action.falseCond, p, cmd);
			}
			if (typeof action.command == "function"){
				//console.log(dt.state.command);
				return action.command(Manager, dt.state);
			}
			throw new Error(`Unexpected node in DT: ${title}`);
		}
		return execute(dt, "root", p, cmd);
	}

	static getVisible(obj_name, p){
		let obj = utils.see_object(obj_name, p);
		if (obj){
			return true;
		}
		return false;
	}

	static getDistance(obj_name, p){
		let obj = utils.see_object(obj_name, p);
		return obj[0];
	}

	static getAngle(obj_name, p){
		let obj = utils.see_object(obj_name, p);
		return obj[1];
	}

	static getFaceDir(obj_name, p){
		let obj = utils.see_object(obj_name, p);
		return obj[4];
	}

	static lookAtBottomFlags(p){
		return utils.seeBottomFlags(p)
	}

	static isPlayOn(p, prev){
		if (prev){
			if (p[2].includes("goal")){
				return false;
			}
			return true;
		}
		if (p[2] === "play_on" || p[2] === "drop_ball"){
			return true;
		}
		return false;
	}

	static hearGo(p){
		//console.log(p, p[2].includes("go"));
		return p[2].includes("go");
	}

	static getStrength(distance){
		return Math.min(95, Math.floor(distance * 5));
	}
}

module.exports = Manager;