import { promises as fs } from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

class EventService {

  static async listEvents(): Promise<calendar_v3.Schema$Event[]> {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return res.data.items || [];
  }

  static async createEvent(eventData: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
    });

    return response.data;
  }

  static async updateEvent(
    eventId: string,
    updatedData: calendar_v3.Schema$Event
  ): Promise<calendar_v3.Schema$Event> {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: updatedData,
    });

    return response.data;
  }

  static async deleteEvent(eventId: string): Promise<{ success: true }> {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return { success: true };
  }
}

// Auth helpers
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize(): Promise<OAuth2Client> {
  let client = await loadSavedCredentialsIfExist();
  if (client) return client;

  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) await saveCredentials(client);
  return client;
}

export default EventService;