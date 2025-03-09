const dgram = require('dgram') // Модуль для аботы с UDP
module.exports = async (agent, teamName, version, isGoalie = false) => {
    // Создание сокета
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true})
    agent.setSocket(socket) // Задание сокета для агента
    socket.on('message', (msg, info) => {
        agent.msgGot(msg) // Обработка полученного сообщения
    })
    socket.sendMsg = async (msg) => { // Отравка сообщения серверу
        return new Promise((resolve, reject) => {
            socket.send(Buffer.from(msg), 6000, 'localhost', (err, bytes) => {
                console.log(msg)
                if (err) reject(err)
                resolve(bytes)
            })
        })
    }
    // Инициализация игрока на сервере (без параметра goalie)
    await socket.sendMsg(`(init ${teamName} (version ${version}))` + (isGoalie ? ' (goalie)' : ''))
}
