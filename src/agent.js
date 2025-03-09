const Msg = require('./msg');
const utils = require("./calculations");


class Agent {
    constructor(teamName) {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = true; // Игра начата
        this.act = null; // Действия
        this.rotationSpeed = null; // скорость вращения
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        this.teamName = teamName;
        this.DirectionOfSpeed = null;
        this.turnSpeed = 10; // скорость вращения
        this.flag_distance_epsilon = 1; // значение близости к флагу
        this.flag_direction_epsilon = 10; // значение близости по углу
        this.max_speed = 100; // максимальная скорость
        this.ball_direction_epsilon = 0.5;
        this.leading = false;
        this.goalie = false; // является ли игрок вратарем
        this.prevCatch = 0;
		this.prevTact = null;
        this.playerName = "";
    }


    msgGot(msg) {
        // Получение сообщения
        let data = msg.toString(); // Приведение
        this.processMsg(data); // Разбор сообщения
        this.sendCmd(); // Отправка команды
    }

    setSocket(socket) {
        // Настройка сокета
        this.socket = socket;
    }

    async socketSend(cmd, value, goalie) {
        // Отправка команды
        await this.socket.sendMsg(`(${cmd} ${value})`);
    }

    processMsg(msg) {
        // Обработка сообщения
        let data = Msg.parseMsg(msg); // Разбор сообщения
        if (!data) throw new Error('Parse error\n' + msg);
        if (data.cmd === 'init') this.initAgent(data.p); // Инициализация
        this.analyzeEnv(data.msg, data.cmd, data.p); // Обработка
    }

    initAgent(p) {
        if (p[0] === 'r') this.position = 'r'; // Правая половина поля
        if (p[1]) this.id = p[1]; // id игрока
    }



    analyzeEnv(msg, cmd, p) {
		if (this.teamName === "B"){
            return;
        }

		let tact = p[0];
        if (!this.prevTact || this.prevTact < tact || !this.act){
            console.log(this.playerName, cmd);
            console.log(this.act, this.prevTact, tact);
            this.prevTact = tact;
            this.act = null;
            this.act = this.manager.getAction(this.dt, p, cmd);
            console.log("-------------------");
        }
    }
    

    sendCmd() {
        //console.log(this.act);
        if (this.run) {
            // Игра начата
            if (this.act) {
				this.socketSend(this.act.n, this.act.v);
            }
        }
    }
}

module.exports = Agent;

