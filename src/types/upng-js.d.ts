declare module 'upng-js' {
  type DecodedPng = {
    width: number;
    height: number;
    data: ArrayBuffer;
    tabs: Record<string, unknown>;
  };

  const UPNG: {
    decode(buffer: ArrayBuffer | Uint8Array): DecodedPng;
    toRGBA8(decoded: DecodedPng): ArrayBuffer[];
  };

  export default UPNG;
}
