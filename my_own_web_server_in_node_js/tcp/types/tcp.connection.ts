import { Socket } from "net"

export type TCPConnection =  {
    socket:Socket,
    err?:Error,
    reader?:null | {

        resolve(data:Buffer):void;
        reject(error:Error):void;

    }
    writeData?(buffer:Buffer):void;
    ended?:Boolean
}