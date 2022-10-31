import { DOMObserver } from './lib/domobserver';
import { Traffic } from './lib/traffic';
import { ConnectionInfo } from './lib/connectioninfo';
import { NewRelic } from './lib/newrelic';

// Add DOM Observer utility and window sync.
const dob = new DOMObserver();

/**
 * Site Dashboard Widgets
 */

// Get site ID
const pathArray = window.location.pathname.split('/');
let siteId = pathArray[2];
if (pathArray[1] == 'sites') {
  // Add cache info.
  dob.ready('.site-workshop .workspace-region', async () => {
    // Add cache element.
    const traffic = new Traffic(siteId);
    await traffic.addCacheElement("#navbar-view nav[class$='utilityNavStyle']");
  });

  // Add MySQL button.
  dob.ready('#connectionModal', async () => {
    new ConnectionInfo();
  });

  // Add New Relic
  dob.ready('.workspace-region .tool-region .new-relic', async () => {
    const newrelic = new NewRelic(siteId);
    const envParts = window.location.hash.substring(1).split('/');
    const env = envParts[0];
    await newrelic.getNewRelicKey().then(async () => {
      const nrRegion = document.querySelector(
        '.workspace-region .tool-region .new-relic',
      );
      newrelic.prepareChartArea(nrRegion, env);
    });
  });
} else {
  console.log('Not in site context.');
}
