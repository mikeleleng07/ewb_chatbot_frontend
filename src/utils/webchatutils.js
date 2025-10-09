import axios from 'axios';
import CryptoJS from 'crypto-js';

// 🔹 Generate random token
export function generate_token(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
  const result = [];
  for (let i = 0; i < length; i++) {
    const j = (Math.random() * (chars.length - 1)).toFixed(0);
    result[i] = chars[j];
  }
  return result.join("");
}

// 🔹 Decrypt "ref" query parameter and return username
export function  getParameterByName(name,setusername, url) {
    if (!url) url = window.location.href;
    const cryptoKey = '9pksu9uvbxkyf49ieoe9z7e4q76chpumm4z8vgwgqyxcwevpfy';

    const params = new URLSearchParams(window.location.search);
    let paramsAfterRef = "";
    let isAfterRef = false;

    // Build the encrypted string from query parameters
    for (const [key, value] of params.entries()) {
        if (key === name || isAfterRef) {
            if (isAfterRef) {
                paramsAfterRef += `&${key}=${value}`;
            } else {
                paramsAfterRef += `${value}`;
                isAfterRef = true;
            }
        }
    }

    try {
        // Fix: Convert to valid base64 if it's URL-safe
        let base64 = paramsAfterRef.replace(/-/g, '+').replace(/_/g, '/');
        base64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

        // Decode base64 and decrypt
        const decrypted = CryptoJS.AES.decrypt(base64, cryptoKey);
        let originalText = decrypted.toString(CryptoJS.enc.Utf8);

        originalText = originalText.replace(/^"|"$/g, '');
        if (originalText) {
            paramsAfterRef = originalText;
        }

        return paramsAfterRef;
    } catch (err) {
        console.error("Decryption failed:", err);
    }
}

// 🔹 Generate Bot token via Azure Logic App
export async function generateServerToken(BotSource) {
  const id = generate_token(50);
  const body = {
    "ID": `${id}`,
    "BotSource": BotSource
  };

  let result;
  let requestResult = { status: 'pending' };
  //prod
  let endpoint ='https://prod-04.southeastasia.logic.azure.com:443/workflows/38862def15fe493e92caa00943fcb21e/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=m7-qGMNHR0HuFgbADv8xxKSAUw9vp4C4rgOOF9LMjms';
  
 //dev
  //let endpoint = 'https://prod-37.southeastasia.logic.azure.com:443/workflows/71bca51f8a56451bb28244aa1c7242c0/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3oDRlO3vOODIP3v1g1agnhRrYtDBbxTnQb9rHSoZV8U'
  const config = {
    method: 'post',
    url: endpoint,
    headers: { 
      'Content-Type': 'application/json'
    },
    data: body
  };

  axios(config)
    .then(response => {
      result = response.data;
      requestResult.status = 'success';
      
    })
    .catch(error => {
      result = error;
      requestResult.status = 'failed';
      console.error('Error generating token:', error);
    });

  // Wait for response or timeout
  const maxTimeToWait = 100;
  for (let timer = 0; timer < maxTimeToWait; timer++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (requestResult.status !== 'pending') break;
    if (timer >= maxTimeToWait - 1) {
      requestResult.status = 'timeout';
      break;
    }
  }

  return result;
}
export function ChatbotStyle() {
  const styleOptions = {
    bubbleBackground: '#542785',
    bubbleFromUserBackground: 'rgb(177,0,111)',
    rootHeight: '98%',
    rootWidth: '100%',
    bubbleFromUserNubOffset: 'bottom',
    bubbleFromUserNubSize: 10,
    bubbleNubOffset: 'top',
    bubbleNubSize: 10,
    bubbleFromUserBorderColor: 'rgb(177,0,111)',
    bubbleFromUserBorderRadius: 2,
    bubbleFromUserBorderStyle: 'solid',
    bubbleFromUserBorderWidth: 1,
    bubbleBorderColor: '#542785',
    bubbleBorderRadius: 2,
    bubbleBorderStyle: 'solid',
    bubbleBorderWidth: 1,
    bubbleFromUserTextColor: 'white',
    bubbleTextColor: 'white',
    sendBoxTextColor: 'black'
  };

  return styleOptions;
}

export function getBrowserInfo() {
  const userAgent = navigator.userAgent;

  if (/chrome|crios|crmo/i.test(userAgent) && !/edge|edgios|opr|opera/i.test(userAgent))
    return 'Chrome';
  if (/firefox|fxios/i.test(userAgent))
    return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome|crios|crmo/i.test(userAgent))
    return 'Safari';
  if (/edg/i.test(userAgent))
    return 'Edge';
  if (/opr|opera/i.test(userAgent))
    return 'Opera';
  if (/msie|trident/i.test(userAgent))
    return 'Internet Explorer';
  
  return 'Unknown';
}