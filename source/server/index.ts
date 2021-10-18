
import Express from "express"
import Http from "http"
import SocketIO from "socket.io"

const port = 8888
const app = Express()
const server = Http.createServer(app)

// Serve the client stuff
app.use(Express.static("../client"))
server.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})

// Serve the socket stuff
const io = new SocketIO.Server(server)
io.on("connection", (connection) => {
    console.log("A CONNECTION!!!")

    connection.on("message", function (message: any) {
        console.log(message)
        connection.emit("message", message)
    })
})