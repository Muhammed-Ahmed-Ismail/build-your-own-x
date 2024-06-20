import { DynamicBuffer } from "../types/dynamic.buffer";
import { parseHttpHeader } from "./http.utils";

export function cutMessage(buffer:DynamicBuffer): HTTPReq | null{
    const idx = buffer.data.subarray(0,buffer.length).indexOf('\r\n\r\n')
    if(idx < 0)
        return null

    let msg = parseHttpHeader(buffer.data)
    
    
    popBuf(buffer,idx+4)
    
    return msg
}

export function popBuf(baffer:DynamicBuffer , len:number = 0) : void{
    baffer.data.copyWithin(0,len,baffer.length)
    baffer.length -= len
}


export function pushBuf(messageBuffer:DynamicBuffer,data:Buffer){
    const totLen = messageBuffer.length + data.length;
    if(totLen > messageBuffer.data.length){
        expandBuffer(messageBuffer,totLen)
    }

    data.copy(messageBuffer.data,messageBuffer.length ,0)
    messageBuffer.length = totLen
  
    
    

}

function expandBuffer(dyBuffer:DynamicBuffer , newSizeTo:number){
        let size = Math.max(dyBuffer.data.length,32);
        // let oldSize = dyBuffer.length;
        while(size < newSizeTo)
            size *= 2;

        const newBuffer = Buffer.alloc(size)

        dyBuffer.data.copy(newBuffer,0,0)

       
        
        dyBuffer.data = newBuffer
        // dyBuffer.length = oldSize
}