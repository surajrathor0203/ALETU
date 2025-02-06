export const GOOGLE_API_CONFIG = {
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  scope: 'https://www.googleapis.com/auth/calendar.events',
  calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary'
};