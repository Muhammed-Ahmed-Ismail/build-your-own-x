class HttpError extends Error {
    constructor(message: string , statusCode : number) {
        super(message)
    }
}
export default HttpError