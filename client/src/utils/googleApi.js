
import { GOOGLE_API_CONFIG } from '../config/googleConfig';

let gapiPromise = null;

export const initializeGoogleApi = () => {
  if (!gapiPromise) {
    gapiPromise = new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_API_CONFIG.apiKey,
            clientId: GOOGLE_API_CONFIG.clientId,
            discoveryDocs: GOOGLE_API_CONFIG.discoveryDocs,
            scope: GOOGLE_API_CONFIG.scope,
          });
          resolve(window.gapi);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  return gapiPromise;
};