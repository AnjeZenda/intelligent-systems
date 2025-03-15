const Msg = require('./msg');
const TManager = require('./timeMachineManager');
const goal_keeper_TA = require("./goal_keeper_time_machine");
const fw_TA = require("./fw_time_machine");
const Taken = require("./taken");


class Agent {
    constructor(teamName, goalkeeper) {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = false; // Игра начата
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
        this.goalie = goalkeeper; // является ли игрок вратарем
        this.prevCatch = 0;
        this.prevTact = null;
        this.playerName = "";
        this.state = {'time': 0}; // текущее состояние игрока
        this.TManager = TManager;
        this.taken = new Taken();
        this.ta = null;
        if (goalkeeper){
            this.ta = goal_keeper_TA;
        } else {
            this.ta = fw_TA;
        }
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
        if (data.cmd == 'hear' && data.p[2] == 'play_on') this.run = true;
        if (data.cmd === 'init') this.initAgent(data.p); // Инициализация
        if (data.cmd == 'hear' && data.p[2].includes('goal')) {this.goal = true; this.run = false}
        this.analyzeEnv(data.msg, data.cmd, data.p); // Обработка
    }

    initAgent(p) {
        if (p[0] === 'r') this.position = 'r'; // Правая половина поля
        if (p[1]) this.id = p[1]; // id игрока
    }





    writeHearData(data){
        this.state['hear'] = {"who": data[0], "msg": data[1]};
    }


    analyzeEnv(msg, cmd, p) {
        if (this.goal) {
            this.update()
            if (this.goalie) this.socketSend("move", "-40 0", true)
            else this.socketSend("move", "-30 0")
            this.goal = false
            return
        }
        if (!this.run) return
        
        if (cmd === "see"){
            //console.log(this.taken.state['ball']);
            this.taken.state['time'] = p[0];
            this.taken.set(p);
            this.act = this.TManager.getAction(this.taken, this.ta, this.teamName);

            // Вызов автомата
            this.taken.resetState();
        }

        if (cmd === "hear"){
            this.writeHearData(p);
        }

        if (cmd === "sense_body"){
            this.taken.writeSenseData(p);
        }
    }
    

    sendCmd() {
        //console.log(this.act);
        if (this.run) {
            // Игра начата
            if (this.act) {
                this.socketSend(this.act.n, this.act.v);
            }
            this.act = null; // Сброс команды
        }
    }

    update() {
        if (this.goalie){
            this.ta.update()
        } else {
            this.ta.update();
        }
    }
}

module.exports = Agent;

