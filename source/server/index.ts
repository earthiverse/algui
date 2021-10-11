
import Express from "express"
import Http from "http"

const server = Express()
Http.createServer(server)

const port = 8888
server.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})