import * as net from "net";
import { TCPConnection } from "./types/tcp.connection";
import { assert, log } from "console";
import { TCPListener } from "./types/tcp.listener";
import { DynamicBuffer } from "./types/dynamic.buffer";
import { cutMessage, pushBuf } from "./utils/dynamic.buffer.utils";
import { buffer } from "stream/consumers";
import HttpError from "./errors/http.error";
import { handleRequest, readBody, writeHTTPResp } from "./utils/http.utils";
import { statusCode } from "./utils/status.code.enum";

export async function accept(listener: TCPListener): Promise<void> {

    return new Promise<void>((resolve, reject) => {
        listener.listener = { resolve, reject }
        listener.socket.on('connection', async (socket: net.Socket) => {
            console.log("accepted connection from ", socket.remoteAddress);
            try {
                const tcpconn = initSocket(socket)
                await serveClient(tcpconn)

                resolve()
            } catch (exc) {
                reject(exc)
            } finally {

                socket.destroy();
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
        console.log("connection ended");

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

        if (connection.ended) {
            resolve(Buffer.from(''));
            // EOF
            return;
        }

        connection.socket.resume()
    })
}

export function writeData(data: Buffer, connection: TCPConnection): Promise<void> {
    assert(data.length >= 1)
    return new Promise<void>((resolve, reject) => {

        connection.socket.write(data, (err) => {
            if (err)
                reject(err)
            else {
                console.log("inside write data", data.toString());

                resolve();
            }

        })
    })
}

export async function serveClient(conn: TCPConnection): Promise<void> {
    console.log("inside serverClient");

    const clientBuffer: DynamicBuffer = { data: Buffer.alloc(0), length: 0 }
    while (true) {

        let msg: null | HTTPReq = cutMessage(clientBuffer)

        if (!msg) {

            const data = await readData(conn);



            pushBuf(clientBuffer, data)

            if (data.length === 0 && buffer.length === 0) {
                return; // no more requests
            }
            if (data.length === 0) {
                throw new HttpError('Unexpected EOF.', statusCode.BAD_REQUEST);
            }
            // got some data, try it again.
            continue;
        }

        const reqBody: BodyReader = readBody(msg, conn, clientBuffer)

        const res: HTTPRes = await handleRequest(msg, reqBody)


        await writeHTTPResp(conn, res);
        // close the connection for HTTP/1.0
        if (msg.version === '1.0') {
            return;
        }


        // make sure that the request body is consumed completely
        while ((await reqBody.read()).length > 0) {}

        return

    }
}


const server: net.Server = net.createServer(
    { pauseOnConnect: true },
);



server.on("close", () => {

    console.log("connection is closed");

})

export {
    server,
    readData
}