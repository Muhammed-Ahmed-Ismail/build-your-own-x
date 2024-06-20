import { buffer } from "stream/consumers"
import { TCPConnection } from "../types/tcp.connection";
import { DynamicBuffer } from "../types/dynamic.buffer";
import { splitBuffer } from "./buffer_utils";
import HttpError from "../errors/http.error";
import { readData, writeData } from "../tcp.server";
import { popBuf, pushBuf } from "./dynamic.buffer.utils";
import { statusCode } from "./status.code.enum";

export function parseHttpHeader(data: Buffer): HTTPReq {
    const lines = splitLines(data)

    const [method, uri, version] = parseRequestLine(lines[0]);


    const httpReq: HTTPReq = { method: method.toString(), version: version.toString(), uri: uri, headers: lines.slice(1) }

    resolveHeadersMap(httpReq)



    return httpReq
}

function splitLines(data: Buffer) {
    const lines = []

    let idx, start = 0

    idx = data.indexOf('\r\n')

    while (idx !== -1) {
        let line = data.slice(start, idx)


        lines.push(line)
        start = idx + 2
        idx = data.indexOf('\r\n', start)
    }


    return lines
}

function parseRequestLine(line: Buffer) {
    const dim = ' '

    const parts = []

    let idx = line.indexOf(dim)
    let start = 0
    let i = 0;
    while (i < 3) {
        parts.push(line.slice(start, idx))
        start = idx + dim.length
        idx = line.indexOf(dim, start)
        i++;
    }



    return parts
}

export function readBody(req: HTTPReq, tcpconn: TCPConnection, buffer: DynamicBuffer): BodyReader {
    // what headers tell about the req ie how can req get read


    const contentLength = req.HEADERS?.get('Content-Length')

 


    let bodyLen = -1
    if(contentLength){
        bodyLen = parseInt(contentLength, 10)
        if (isNaN(bodyLen)) {
            throw new HttpError('Invalid content length', statusCode.BAD_REQUEST)
        }
    
    }

   
    const bodyAllowed = !(req.method === 'GET' || req.method === 'HEAD');

    if (!bodyAllowed && bodyLen > 0) {
        throw new HttpError('Body not allowed', statusCode.BAD_REQUEST)
    }

    return getBodyReader(tcpconn, buffer, bodyLen)
}

function getBodyReader(tcpconn: TCPConnection, buffer: DynamicBuffer, bodyLength: number): BodyReader {
    return {
        length: bodyLength,
        read: async () => {

            if (bodyLength <= 0) {
                return Buffer.from('')
            }
            if (buffer.length === 0) {
                // try to get some data if there is none
                const data = await readData(tcpconn);
                pushBuf(buffer, data);
                if (data.length === 0) {
                    // expect more data!
                    throw new Error('Unexpected EOF from HTTP body');
                }
            }

            const consume = Math.min(buffer.length, bodyLength);
            bodyLength -= consume;
            const data = Buffer.from(buffer.data.subarray(0, consume));
            popBuf(buffer, consume);
            return data;

        }
    }
}


function resolveHeadersMap(httpMsg: HTTPReq | HTTPRes) {
    const map = new Map<string, string>();

    httpMsg.headers.forEach((buffer: Buffer) => {
        let idx = buffer.indexOf(":")
        if (idx > -1) {
            let headerParts = splitBuffer(buffer, ':')

            // if(headerParts.length == 2)
            map.set(headerParts[0].toString(), headerParts[1].toString())
        }
    })

    httpMsg.HEADERS = map
}

export async function handleRequest(httpReq: HTTPReq, bodyReader: BodyReader): Promise<HTTPRes> {

    let resp: BodyReader;
    switch (httpReq.uri.toString('latin1')) {
        case '/echo':
            // http echo server
            resp = bodyReader;
            break;
        default:
            resp = readerFromMemory(Buffer.from('hello world.\n'));
            break;
    }
    return {
        code: 200,
        headers: [Buffer.from('Server: my_first_http_server')],
        body: resp,
    };
    // return {
    //     code: statusCode.OK, headers: [
    //         Buffer.from('Content-Type: text/HTML'),
    //         Buffer.from('Server: TCP Server')
    //     ], body: bodyReader || Buffer.from('hello world')
    // }
}

export async function writeHTTPResp(conn: TCPConnection, resp: HTTPRes): Promise<void> {
    if (resp.body.length < 0) {
        throw new Error('TODO: chunked encoding');
    }
    resolveHeadersMap(resp)
    // set the "Content-Length" field
    console.assert(!resp.HEADERS?.get('Content-Length'));
    resp.headers.push(Buffer.from(`Content-Length: ${resp.body.length}`));
    // write the header
    await writeData(await encodeHTTPResp(resp), conn);
    // write the body
    while (true) {
        const data = await resp.body.read();
        if (data.length === 0) {
            break;
        }
        await writeData(data, conn);
    }
}

async function encodeHTTPResp(resp: HTTPRes): Promise<Buffer> {
    const statusCode = resp.code
    const headers = resp.headers
    const body = await resp.body.read()
    const statusLine = `HTTP/1.1 ${statusCode}\r\n`;

    const resParts = []

    resParts.push(statusLine)

    for (let [key, value] of Object.entries(headers)) {
        resParts.push(`${key}: ${value}\r\n`);
    }

    
    
    resParts.push('\r\n');
    // resParts.push((await body.read()).toString('utf-8'));
    resParts.push(body);
    return Buffer.from(resParts.join(''), 'utf-8');
}

function readerFromMemory(data: Buffer): BodyReader {
    let done = false;
    return {
        length: data.length,
        read: async (): Promise<Buffer> => {
            if (done) {
                return Buffer.from(''); // no more data
            } else {
                done = true;
                return data;
            }
        },
    }
}