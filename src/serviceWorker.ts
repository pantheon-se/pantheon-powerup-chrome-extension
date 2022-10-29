import { initializeStorageWithDefaults } from './storage';

chrome.runtime.onInstalled.addListener(async () => {
  // Here goes everything you want to execute after extension initialization

  await initializeStorageWithDefaults({});

  console.log('Extension successfully installed!');
});

// Log storage changes, might be safely removed
chrome.storage.onChanged.addListener((changes) => {
  for (const [key, value] of Object.entries(changes)) {
    console.log(
      `"${key}" changed from "${value.oldValue}" to "${value.newValue}"`,
    );
  }
});

// New Relic Listener
function processConnection(message: any, sender: any, sendResponse: any) {
  if (message?.newrelic !== undefined) {
    fetch(message.url, message.options)
      .then(async (resp) => {
        if (resp.ok) {
          sendResponse(await resp.json());
        }
        throw new Error(String(resp.statusText));
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return true;
}
chrome.runtime.onMessage.addListener(processConnection);
