import { DOMObserver } from './lib/domobserver';
import { Traffic } from './lib/traffic';
import { ConnectionInfo } from './lib/connectioninfo';

// Add DOM Observer utility.
const dob = new DOMObserver();

// Add cache info.
dob.ready('.site-workshop .workspace-region', async (el) => {
  // Add cache element.
  const traffic = new Traffic();
  await traffic.addCacheElement("#navbar-view nav[class$='utilityNavStyle']");
});

// Add MySQL button.
dob.ready('#connectionModal', async (el) => {
  const ci = new ConnectionInfo();
});
