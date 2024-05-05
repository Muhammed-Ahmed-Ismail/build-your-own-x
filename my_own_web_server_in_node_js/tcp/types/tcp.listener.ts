import { Server, Socket } from "net"
import { TCPConnection } from "./tcp.connection";

export type TCPListener = {
    socket:Server;
    listener? : null | {
        resolve():void;
        reject(error:Error):void;
    }
}