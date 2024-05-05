import * as tcp from "./tcp/tcp.server"
import { TCPConnection } from "./tcp/types/tcp.connection"


async function main() {
    tcp.server.listen(4000, '0.0.0.0',)

    const tcpListener = tcp.listen(tcp.server)

    await tcp.accept(tcpListener)


}

main()