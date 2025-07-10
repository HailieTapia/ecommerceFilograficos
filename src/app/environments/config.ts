export const environment = {
  production: false,
  baseUrl: 'https://backend-filograficos.vercel.app/api',
  recaptchaSiteKey: '6Lck9V8qAAAAAEnjZRJxMKa27R1P_GWppjLuxmbG',
  vapidKey: 'BAYyMOMC8yptUWH2E3n9nugPQBpVPnBtF0CsR55SL818_hG3pVTrH1q6bTW7fWniLQaFN3_U2f2g1LHMgKHnLA4',
  clientId: 'amzn1.application-oa2-client.b6c7598ea28b41efa0f7cfa3e306f67b',
  clientSecret: 'your_alexa_client_secret_here', // Añadir el mismo clientSecret que en el backend
  alexaRedirectUrls: [
    'https://layla.amazon.com/spa/skill/account-linking-status.html?vendorId=M34IVTO0VOKV0U',
    'https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=M34IVTO0VOKV0U',
    'https://alexa.amazon.co.jp/spa/skill/account-linking-status.html?vendorId=M34IVTO0VOKV0U'
  ],
  alexaScopes: ['read:orders', 'write:orders', 'profile', 'email'] // Scopes soportados
};