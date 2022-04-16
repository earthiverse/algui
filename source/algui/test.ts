import AL from "alclient"
import { startServer, addSocket } from "./index.js"

async function run() {
    await AL.Game.loginJSONFile("../../credentials.json")
    const G = await AL.Game.getGData(true, false)
    startServer(8080, G)
    const observer = await AL.Game.startObserver("US", "I")
    addSocket("US I", observer.socket, observer)

    const observer2 = await AL.Game.startObserver("US", "II")
    addSocket("US II", observer2.socket, observer2)
}
run()