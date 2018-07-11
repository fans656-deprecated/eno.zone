import { logger } from '../util';

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const previousRegistrations = await navigator.serviceWorker.getRegistrations();
    if (previousRegistrations.length) {
      for(let registration of previousRegistrations) {
        await registration.unregister();
      }
    }
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      logger.error('register sw failed', e);
      return false;
    }
    return true;
  } else {
    return false;
  }
}

export async function sendMessage(message) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (response) => {
      resolve(response);
    };
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      logger.error('nocontroller', navigator.serviceWorker);
      return;
    }
    navigator.serviceWorker.controller.postMessage(
      message, [channel.port2]
    );
  });
}
