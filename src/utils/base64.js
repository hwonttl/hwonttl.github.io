// src/utils/base64.js
import { Base64 } from 'js-base64';

export const encodeData = (data) => Base64.encode(JSON.stringify(data));

export const decodeData = (data) => {
  try {
    return JSON.parse(Base64.decode(data));
  } catch (error) {
    console.error("Failed to decode data:", error);
    return null;
  }
};
