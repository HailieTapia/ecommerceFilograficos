export const environment = {
  production: true,
  mercadoPagoPublicKey: 'APP_USR-c965b21a-f85b-4a51-b686-b5cd62da9acc',
  baseUrl: 'http://localhost:3000/api',
  recaptchaSiteKey: '6Lck9V8qAAAAAEnjZRJxMKa27R1P_GWppjLuxmbG',
  vapidKey: 'BAYyMOMC8yptUWH2E3n9nugPQBpVPnBtF0CsR55SL818_hG3pVTrH1q6bTW7fWniLQaFN3_U2f2g1LHMgKHnLA4',
  clientId: 'amzn1.application-oa2-client.686611e35ce04198b886556bda1981b0',
  alexaRedirectUrls: [
    'https://layla.amazon.com/api/skill/link/M34IVTO0VOKV0U',
    'https://pitangui.amazon.com/api/skill/link/M34IVTO0VOKV0U',
    'https://alexa.amazon.co.jp/api/skill/link/M34IVTO0VOKV0U'
  ],
  alexaScopes: ['read:orders', 'write:orders', 'profile', 'email'] // Scopes soportados
};