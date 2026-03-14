import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeInMemoryStore,
  WASocket,
  proto,
  delay,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';
import pino from 'pino';

let socket: WASocket | null = null;
let isInitializing = false;
let qrCodeCallbacks: ((qr: string) => void)[] = [];
let readyCallbacks: (() => void)[] = [];
let authenticatedCallbacks: (() => void)[] = [];
let disconnectedCallbacks: ((reason: string) => void)[] = [];

const AUTH_DIR = process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth';

// Create pino logger with minimal output
const logger = pino({ level: 'silent' });

export function getWhatsAppClient(): WASocket {
  if (!socket) {
    throw new Error('WhatsApp client not initialized. Call initializeClient() first.');
  }
  return socket;
}

export async function initializeClient(): Promise<void> {
  if (socket) {
    return;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    // Ensure auth directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Create WhatsApp socket
    socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Chrome (Linux)', '', ''], // Mimic real Chrome browser
    });

    // Save credentials on update
    socket.ev.on('creds.update', saveCreds);

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR code received
      if (qr) {
        console.log('QR Code received');
        try {
          const qrImage = await QRCode.toDataURL(qr);
          qrCodeCallbacks.forEach(cb => cb(qrImage));
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }

      // Connection closed
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to', lastDisconnect?.error, 'reconnecting:', shouldReconnect);

        socket = null;
        disconnectedCallbacks.forEach(cb => cb('Connection closed'));

        // Auto-reconnect if not logged out
        if (shouldReconnect) {
          setTimeout(() => {
            initializeClient();
          }, 3000);
        }
      }

      // Connection opened
      if (connection === 'open') {
        console.log('WhatsApp connection opened');
        authenticatedCallbacks.forEach(cb => cb());
        readyCallbacks.forEach(cb => cb());
      }
    });

    console.log('WhatsApp client initialized with Baileys');
  } catch (error) {
    console.error('Error initializing WhatsApp client:', error);
    socket = null;
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function onQRCode(callback: (qr: string) => void): () => void {
  qrCodeCallbacks.push(callback);
  return () => {
    qrCodeCallbacks = qrCodeCallbacks.filter(cb => cb !== callback);
  };
}

export function onReady(callback: () => void): () => void {
  readyCallbacks.push(callback);
  return () => {
    readyCallbacks = readyCallbacks.filter(cb => cb !== callback);
  };
}

export function onAuthenticated(callback: () => void): () => void {
  authenticatedCallbacks.push(callback);
  return () => {
    authenticatedCallbacks = authenticatedCallbacks.filter(cb => cb !== callback);
  };
}

export function onDisconnected(callback: (reason: string) => void): () => void {
  disconnectedCallbacks.push(callback);
  return () => {
    disconnectedCallbacks = disconnectedCallbacks.filter(cb => cb !== callback);
  };
}

export async function sendMessage(
  phoneNumber: string,
  message: string,
  mediaUrl?: string
): Promise<any> {
  const client = getWhatsAppClient();

  if (!client) {
    throw new Error('WhatsApp client not ready');
  }

  try {
    // Format phone number for WhatsApp (ensure it has @s.whatsapp.net)
    const formattedNumber = phoneNumber.includes('@s.whatsapp.net')
      ? phoneNumber
      : `${phoneNumber.replace(/[^\d]/g, '')}@s.whatsapp.net`;

    if (mediaUrl) {
      // Send message with media
      const response = await fetch(mediaUrl);
      const buffer = await response.arrayBuffer();

      return await client.sendMessage(formattedNumber, {
        image: Buffer.from(buffer),
        caption: message,
      });
    } else {
      // Send text message
      return await client.sendMessage(formattedNumber, {
        text: message,
      });
    }
  } catch (error: any) {
    console.error(`Error sending message to ${phoneNumber}:`, error);
    throw new Error(error.message || 'Failed to send message');
  }
}

export async function getClientStatus(): Promise<{
  isConnected: boolean;
  isReady: boolean;
}> {
  if (!socket) {
    return { isConnected: false, isReady: false };
  }

  try {
    // Check if socket is authenticated and open
    const isReady = socket.user !== undefined;
    return {
      isConnected: isReady,
      isReady: isReady,
    };
  } catch (error) {
    return { isConnected: false, isReady: false };
  }
}

export async function disconnectClient(): Promise<void> {
  if (socket) {
    await socket.logout();
    socket = null;
    qrCodeCallbacks = [];
    readyCallbacks = [];
    authenticatedCallbacks = [];
    disconnectedCallbacks = [];
  }
}

export function isClientReady(): boolean {
  return socket !== null && socket.user !== undefined;
}
