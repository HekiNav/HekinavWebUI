
export default class RealtimeHandler {
    constructor(url, query, returnFormat, callback) {
        this.callback = callback
        this.returnFormat = returnFormat
        this.client = mqtt.connect(url)
        this.client.on("connect", () => {
            this.client.subscribe(query, (err) => {
                if (err) console.log("MQTT Error:", err)
                else console.log("Subscription succeeded to", url)
            });
        })
        this.client.on("message", (topic, message) => {
            switch (this.returnFormat) {
                case "JSON":
                    this.callback(JSON.parse(message.toString()), topic.split("/"))
                    break
                case "GTFSRT":
                    this.callback(gtfsrt.decode(new Uint8Array(message)), topic.split("/"))
                    break
                default:
                    this.callback(message, topic)
                    break
            }
        });
    }
    end() {
        this.client.end()
    }
}