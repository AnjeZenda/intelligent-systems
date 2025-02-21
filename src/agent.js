const Msg = require('./msg')
// Подключение модуля разбора сообщений от сервера
const readline = require('readline')
const app = require("./app")
// Подключение модуля ввода из командной строки
class Agent {
    constructor() {
        this.position = "1" // По умолчанию ~ левая половина поля
        this.run = false // Игра начата
        this.act = null // Действия
        this.rotationSpeed = 0 // Скорость вращения
        this.initialCoords = {x: 0, y: 0} // Начальные координаты

        this.r1 = readline.createInterface({ // Чтение консоли
            input: process.stdin,
            output: process.stdout
        })

        // Запрос начальных координат и скорости вращения
        this.r1.question('Введите начальные координаты (x y): ', (coords) => {
            const [x, y] = coords.split(' ').map(Number);
            this.initialCoords = {x, y}; 
            //TODO игрок не всегда устанавливается правильно, при одинаковых координатах может попасть в другое место
            this.r1.question('Введите скорость вращения: ', (speed) => {
                this.rotationSpeed = Number(speed);
                this.socketSend("move", `${x} ${y}`);
                this.r1.close();
            });
        });

        this.r1.on('line', (input) => { // Обработка строки из консоли
            if (this.run) { // Если игра начата
                // Движения вперед, вправо, влево, удар по мячу
                if("w" == input) this.act = {n: "dash", v: 100}
                if("d" == input) this.act = {n: "turn", v: 20}
                if("a" == input) this.act = {n: "turn", v: -20}
                if("s" == input) this.act = {n: "kick", v: 100}
            }
        })
        this.coords = {x: 0, y: 0}
    }
    msgGot(msg) { // Получение сообщения
        let data = msg.toString('utf8') // Приведение с строке
        this.processMsg(data) // Разбор сообщения
        this.sendCmd() // Отправка команды к строке
    }
    setSocket(socket) { // Настройка сокета
        this.socket = socket
    }
    socketSend(cmd, value) { // Отправка команды
        this.socket.sendMsg(`(${cmd} ${value})`)
    }
    processMsg(msg) { // Обработка сообщения
        let data = Msg.parseMsg(msg) // Разбора сообщения
        if (!data) throw new Error("Parse error\n" + msg)
        // Первое (hear) - начало игры
        if (data.cmd == "hear") this.run = true
        if (data.cmd == "init") this.initAgent(data.p) // Иницализация
        this.analyzeEnv(data.msg, data.cmd, data.p) // Обработка
    }
    initAgent(p) {
        if(p[0] == "r") this.position = "r" // Правая половина поля
        if(p[1]) this.id = p[1] // id игрока
    }
    calculatePosition(x1, y1, x2, y2, d1, d2) {
        // Как выбрать флаги?
        alpha = (y1 - y2) / (x2 - x1)
        beta = (y2**2 - y1**2 + x2**2 - x1**2 + d1**2 - d2**2) / 2 * (x2 - x1)
        a = alpha**2 + 1
        b = -2 * (alpha * (x1 - beta) + y1)
        c = (x1 - beta)**2 + y1**2 - d1**2
        y_ans_1 = (-b + Math.sqrt(b**2 - 4*a*c)) / 2*a
        y_ans_2 = (-b - Math.sqrt(b**2 - 4*a*c)) / 2*a
        x_ans_1 = x1 + Math.sqrt(d1**2 - (y - y1)**2)
        x_ans_2 = x1 - Math.sqrt(d1**2 - (y - y1)**2)
    }
    analyzeEnv(msg, cmd, p) { //
        if (this.run && cmd === "see") {
            if (p){
                const flags = this.parseFlags(p); //TODO работает неправильно
                const opponents = this.parseOpponents(p); //TODO работает неправильно
                console.log(flags, opponents)
                if (flags.length >= 2) {
                    const pos = this.calculatePosition(flags);
                    console.log("Игрок:", pos);
                }
    
                if (opponents.length > 0) {
                    const opponent = opponents[0];
                    const relPos = this.toCartesian(opponent.distance, opponent.angle);
                    const absPos = {
                        x: this.coords.x + relPos.x,
                        y: this.coords.y + relPos.y
                    };
                    console.log("Противник:", absPos);
                }
            }
            
        }
    }

    parseFlags(p) {
        const flags = [];
        for (const item of p) {
            if (typeof item === "object" && item.cmd.p) {
                const cmdData = item.cmd.p;
                if (cmdData[0] === "f") {
                    // Генерируем правильный идентификатор флага
                    const flagParts = cmdData.slice(1);
                    const flagId = flagParts.join("")
                        .replace(/ /g, "") // Удаляем пробелы
                        .replace("O", "0"); // Исправляем опечатку во Flags

                    // Проверяем существование флага
                    if (app.Flags[flagId]) {
                        const [distance, angle] = item.p;
                        flags.push({
                            id: flagId,
                            distance,
                            angle,
                            x: app.Flags[flagId].x,
                            y: app.Flags[flagId].y
                        });
                    }
                }
            }
        }
        return flags;
    }

    
    calculatePosition(visibleFlags) {
        if (visibleFlags.length < 2) return null;

        // Выбираем два флага с известными абсолютными координатами
        const flag1 = visibleFlags[0];
        const flag2 = visibleFlags[1];

        // Шаг 1: Перевести полярные координаты флагов в декартовы (относительно игрока)
        const toCartesian = (distance, angle) => {
            const rad = (angle * Math.PI) / 180; // Угол в радианах
            return {
                x: distance * Math.cos(rad),
                y: distance * Math.sin(rad)
            };
        };

        // Относительные координаты флагов
        const relFlag1 = toCartesian(flag1.distance, flag1.angle);
        const relFlag2 = toCartesian(flag2.distance, flag2.angle);

        // Шаг 2: Абсолютные координаты флагов (из констант)
        const absFlag1 = { x: flag1.x, y: flag1.y };
        const absFlag2 = { x: flag2.x, y: flag2.y };

        // Шаг 3: Решение системы уравнений
        // (x - absFlag1.x)^2 + (y - absFlag1.y)^2 = (relFlag1.x)^2 + (relFlag1.y)^2
        // (x - absFlag2.x)^2 + (y - absFlag2.y)^2 = (relFlag2.x)^2 + (relFlag2.y)^2

        // Упрощение системы
        const A = 2 * (absFlag2.x - absFlag1.x);
        const B = 2 * (absFlag2.y - absFlag1.y);
        const C = Math.pow(absFlag1.x, 2) - Math.pow(absFlag2.x, 2) +
                  Math.pow(absFlag1.y, 2) - Math.pow(absFlag2.y, 2) +
                  Math.pow(relFlag2.x, 2) + Math.pow(relFlag2.y, 2) -
                  Math.pow(relFlag1.x, 2) - Math.pow(relFlag1.y, 2);

        // Решение для y
        const y = (C - A * absFlag1.x) / B;

        // Решение для x
        const x = absFlag1.x + (relFlag1.x ** 2 + relFlag1.y ** 2 - (y - absFlag1.y) ** 2) ** 0.5;

        return { x, y };
    }

    parseOpponents(p) {
        const opponents = [];
        for (const item of p) {
            if (typeof item === "object" && item.cmd.p) {
                const cmdData = item.cmd.p;
                if (cmdData[0] === "player") {
                    const team = cmdData[1];
                    if (team !== this.teamName) {
                        const [distance, angle] = item.p;
                        opponents.push({
                            team,
                            number: cmdData[2],
                            distance,
                            angle
                        });
                    }
                }
            }
        }
        return opponents;
    }
    sendCmd() {
        if (this.run) { // Игра начата
            if (this.act) { // Есть команда от игрока
                if (this.act.n == "kick") // Пнуть мяч
                    this.socketSend(this.act.n, thic.act.v + " 0")
                else // Движение и поворот
                    this.socketSend(this.act.n, this.act.v)
            }
            this.act = null // Сброс команды
        }
    }
}
module.exports = Agent // Экспорт игрока