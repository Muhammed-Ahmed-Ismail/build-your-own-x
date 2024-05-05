import * as net from "net";
import { TCPConnection } from "./types/tcp.connection";
import { assert } from "console";
import { TCPListener } from "./types/tcp.listener";

export function accept(listener:TCPListener):Promise<TCPConnection> {
    
    return new Promise <TCPConnection>((resolve,reject)=>{
        listener.listener = {resolve,reject}
        listener.socket.on('connection',(socket:net.Socket)=>{
        console.log("accepted connection");

            resolve(initSocket(socket))
        })
    })
}

export function listen(listeningServer:net.Server): TCPListener {
    const listener:TCPListener = {
        socket:listeningServer
    }
    return listener
}



function initSocket(socket: net.Socket): TCPConnection {
    const connection: TCPConnection = {
        socket,
    }
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

        connection.socket.write("echo .. " + data, (err) => {
            if (err)
                reject(err)

            resolve()
        })
    })
}

export async function serveClient(conn: TCPConnection): Promise<void> {
    while (true) {
        const data = await readData(conn);
        if (data.length === 0) {
            console.log('end connection');
            break;
        }
        console.log('data', data);
        await writeData(data, conn);
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