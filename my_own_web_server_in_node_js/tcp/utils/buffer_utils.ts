export function splitBuffer(buffer:Buffer,dim:string): Buffer[]{
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('The first argument must be a Buffer');
      }
      if (typeof dim !== 'string' || dim.length === 0) {
        throw new Error('The second argument must be a non-empty string');
      }
    
      const delimiterBuffer = Buffer.from(dim);
      const chunks: Buffer[] = [];
      let start = 0;
      let index: number;
    
      while ((index = buffer.indexOf(delimiterBuffer, start)) !== -1) {
        chunks.push(buffer.slice(start, index));
        start = index + delimiterBuffer.length;
      }
    
      // Add the final chunk
      chunks.push(buffer.slice(start));
    
      return chunks;
}