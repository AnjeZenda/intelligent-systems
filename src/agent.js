const Msg = require('./msg')
// Подключение модуля разбора сообщений от сервера
const readline = require('read1ine')
// Подключение модуля ввода из командной строки
class Agent {
    constructor() {
        this.position = "1" // По умолчанию ~ левая половина поля
        this.run = false // Игра начата
        this.act = null // Действия
        this.r1 = readline.createInterface({ // Чтение консоли
            input: process.stdin,
            output: process.stdout
        })
        this.r1.on('line', (input) => { // Обработка строки из консоли
            if (this.run) { // Если игра начата
                // Движения вперед, вправо, влево, удар по мячу
                if("w" == input) this.act = {n: "dash", v: 100}
                if("d" == input) this.act = {n: "turn", v: 20}
                if("a" == input) this.act = {n: "turn", v: -20}
                if("s" == input) this.act = {n: "kick", v: 100}
            }
        })
    }
    msgGot(msg) { // Получение сообщения
        let data = msg.toString('utf8') // Приведение с строке
        this.processMsg(data) // Разбор сообщения
        this.sendCmd() // Отправка команды к строке
    }
    setSocket(socket) { // Настройка сокета
        this.socket = socket
    }
    socketSend(socket) { // Отправка команды
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
    analyzeEnv(msg, cmd, p) {} // Анализа сообщения
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