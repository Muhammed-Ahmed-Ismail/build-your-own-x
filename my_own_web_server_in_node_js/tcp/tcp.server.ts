import * as net from "net";
import { TCPConnection } from "./types/tcp.connection";
import { assert, log } from "console";
import { TCPListener } from "./types/tcp.listener";
import { DynamicBuffer } from "./types/dynamic.buffer";
import { cutMessage, pushBuf } from "./utils/dynamic.buffer.utils";

export function accept(listener: TCPListener): Promise<void> {

    return new Promise<void>((resolve, reject) => {
        listener.listener = { resolve, reject }
        listener.socket.on('connection', (socket: net.Socket) => {
            console.log("accepted connection from ", socket.remoteAddress);
            try {
                const tcpconn = initSocket(socket)
                serveClient(tcpconn)
                resolve()
            } catch (exc) {
                reject(exc)
            }

        })

    })
}

export function listen(listeningServer: net.Server): TCPListener {
    const listener: TCPListener = {
        socket: listeningServer
    }
    return listener
}



function initSocket(socket: net.Socket): TCPConnection {
    const connection: TCPConnection = {
        socket,
    }
    console.log("inside inint socket");

    socket.on('data', (data: Buffer) => {
        connection.socket.pause()
        connection.reader!.resolve(data)
        connection.reader = null
    })

    socket.on('error', (err) => {
        connection.err = err;

        if (connection.reader) {
            connection.reader.reject(err)
        }
    })
    socket.on('end', () => {
        connection.ended = true;
        if (connection.reader) {
            connection.reader.resolve(Buffer.from(''));
            connection.reader = null
        }
    });
    return connection
}

function readData(connection: TCPConnection): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        connection.reader = {
            reject,
            resolve
        }

        if (connection.err)
            reject(connection.err);

        connection.socket.resume()
    })
}

function writeData(data: Buffer, connection: TCPConnection): Promise<void> {
    assert(data.length >= 1)
    return new Promise<void>((resolve, reject) => {

        connection.socket.write(data, (err) => {
            if (err)
                reject(err)

            resolve()
        })
    })
}

export async function serveClient(conn: TCPConnection): Promise<void> {
    console.log("inside serverClient");

    const clientBuffer: DynamicBuffer = { data: Buffer.alloc(0), length: 0 }
    while (true) {
        
        let msg = cutMessage(clientBuffer)
        
        if (!msg) {

            const data = await readData(conn);
          


            pushBuf(clientBuffer, data)
            //     console.log(clientBuffer.data.toString());

           
            

            if (data.length === 0) {
                console.log('end connection');
                break;
            }
            continue
        }
        // msg = cutMessage(clientBuffer)
        
        if(!msg)
            continue

        if (msg.equals(Buffer.from("quit\n"))) {
            
            await writeData(Buffer.from("bye!"), conn)
            conn.socket.destroy()
            return
        } else {
            const reply = Buffer.concat([Buffer.from("echo..."), msg])
            await writeData(reply, conn);
        }

        // await writeData(data, conn)
    }
}


const server: net.Server = net.createServer(
    { pauseOnConnect: true },
);



server.on("close", () => {

    console.log("connection is closed");

})

export {
    server
}