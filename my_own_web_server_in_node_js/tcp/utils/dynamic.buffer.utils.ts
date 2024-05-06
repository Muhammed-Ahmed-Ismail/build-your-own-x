import { DynamicBuffer } from "../types/dynamic.buffer";

export function cutMessage(buffer:DynamicBuffer): Buffer | null{
    const idx = buffer.data.subarray(0,buffer.length).indexOf("\n")
    if(idx < 0)
        return null

    let msg = Buffer.from(buffer.data.subarray(0,idx+1))
    console.log("before pop");
    console.log(buffer.data.toString());
    
    popBuf(buffer,idx+1)
    console.log("after pop");
    console.log(buffer.data.toString());
    return msg
}

function popBuf(baffer:DynamicBuffer , len:number = 0) : void{
    baffer.data.copyWithin(0,len,baffer.length)
    baffer.length -= len
}


export function pushBuf(messageBuffer:DynamicBuffer,data:Buffer){
    const totLen = messageBuffer.length + data.length;
    console.log('totLen',totLen);
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