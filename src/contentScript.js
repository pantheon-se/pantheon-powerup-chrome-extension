import { DOMObserver } from './lib/domobserver';
import { Traffic } from './lib/traffic';

// Add DOM Observer utility.
const dob = new DOMObserver();

// Add cache info.
dob.ready('.site-workshop .workspace-region', async (el) => {
  // Debugging
  console.log('Element: ', el);
  // Add cache element.
  const traffic = new Traffic();
  await traffic.addCacheElement("#navbar-view nav[class$='utilityNavStyle']");
});
