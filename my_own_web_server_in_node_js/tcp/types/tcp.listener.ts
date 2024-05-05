import { Server, Socket } from "net"
import { TCPConnection } from "./tcp.connection";

export type TCPListener = {
    socket:Server;
    listener? : null | {
        resolve(socket:TCPConnection):void;
        reject(error:Error):void;
    }
}