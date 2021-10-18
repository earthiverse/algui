"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const port = 8888;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Serve the client stuff
app.use(express_1.default.static("../client"));
server.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
// Serve the socket stuff
const io = new socket_io_1.default.Server(server);
io.on("connection", (connection) => {
    console.log("A CONNECTION!!!");
    connection.on("message", function (message) {
        console.log(message);
        connection.emit("message", message);
    });
});
//# sourceMappingURL=index.js.map