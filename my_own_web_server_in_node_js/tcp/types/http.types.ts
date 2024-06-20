type HTTPReq = {
    method: string,
    version: string
    uri: Buffer,
    headers: Buffer[],
    HEADERS?: Map<string, string>
}

type HTTPRes = {
    code: number,
    headers: Buffer[],
    body: BodyReader,
    HEADERS?: Map<string, string>

}

type BodyReader = {
    length: number,
    read: () => Promise<Buffer>
}