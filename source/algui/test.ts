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

    const observer3 = await AL.Game.startObserver("US", "III")
    addSocket("US III", observer3.socket, observer3)

    const observer4 = await AL.Game.startObserver("EU", "I")
    addSocket("EU I", observer4.socket, observer4)

    const observer5 = await AL.Game.startObserver("EU", "II")
    addSocket("EU II", observer5.socket, observer5)

    const observer6 = await AL.Game.startObserver("ASIA", "I")
    addSocket("ASIA I", observer6.socket, observer6)
}
run()