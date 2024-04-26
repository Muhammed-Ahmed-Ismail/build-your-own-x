import * as net from "net";

const server : net.Server = net.createServer();
  
server.on("connection",(socket:net.Socket)=>{
    console.log("new tcp connection is estaplished");

    socket.on("data", (buffer:Buffer)=>{
    console.log(buffer);
    socket.write("echo:... " + buffer)
    })

    socket.on("close",()=>{
        console.log("socket is closed");
    })

    socket.on("end",()=>{
        console.log("end of message");
        socket.end()
    })
})



server.on("close",()=>{
    console.log("connection is closed");
    
})

export {
    server
}