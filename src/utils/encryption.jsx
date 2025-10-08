import CryptoJS from 'crypto-js';


export const encryptConfig = (config, secretKey) => {
  const stringifiedConfig = JSON.stringify(config);
  return CryptoJS.AES.encrypt(stringifiedConfig, secretKey).toString();
};


export const decryptConfig = (encryptedConfig, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedConfig, secretKey);
  const decryptedConfig = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedConfig);
};