import { DOMObserver } from './lib/domobserver';
import { Traffic } from './lib/traffic';
import { ConnectionInfo } from './lib/connectioninfo';
import { NewRelic } from './lib/newrelic';
import { SiteWorkflows } from './lib/siteWorkflows';
import { siteNameChange } from './lib/pantheon';
import crel from 'crel';
import '../styles/contentStyle.scss';

// Add DOM Observer utility and window sync.
const dob = new DOMObserver();

// Add stylesheet
dob.injectStylesheet('styles/contentScript.css');

const getEnv = () => {
  return window.location.hash.substring(1).split('/')[0];
};

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
  const nrSelector = '.workspace-region .tool-region .new-relic';
  dob.ready(nrSelector, async () => {
    const newrelic = new NewRelic(siteId);
    const nrRegion = document.querySelector(nrSelector);
    await newrelic.getNewRelicKey().then(async () => {
      newrelic.clearChartArea(nrRegion);
      newrelic.prepareChartArea(nrRegion, getEnv());
    });
  });

  // Update security nav
  const secNavSelector =
    '.workspace-region .workspace-nav a.js-environment-tools-link[data-name="security"]';
  dob.ready(secNavSelector, () => {
    const secIcon = crel('span', { class: 'glyphicons glyphicons-keys' });
    const secItem = document.querySelector(secNavSelector);
    secItem.text = ' Security & Logs';
    secItem.prepend(secIcon);
  });

  // Add Quicksilver Logs
  const securitySelector = '.workspace-region .tool-region #security-view';
  dob.ready(securitySelector, async () => {
    const siteworkflows = new SiteWorkflows(siteId);
    const secRegion = document.querySelector(securitySelector);
    siteworkflows.prepareArea(secRegion);
    await siteworkflows.addWorkflows(secRegion);
  });

  // Add name change
  const siteNameSelector = "span[class*='siteNameStyles']";
  dob.ready(siteNameSelector, async () => {
    siteNameChange();
  });
} else {
  console.log('Not in site context.');
}
