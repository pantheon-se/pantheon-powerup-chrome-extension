import crel from 'crel';

/**
 * Traffic class
 */
export class Traffic {
  constructor() {
    // do nothing
  }

  /**
   * Add cache element to nav.
   */
  async addCacheElement(selector) {
    // Get site ID
    const pathArray = window.location.pathname.split('/');
    let siteId = pathArray[2];
    console.log(pathArray);
    if (pathArray[1] !== 'sites') {
      console.log('Not in site context.');
      return false;
    }

    const cacheHit = document.querySelector('#pantheon-cache-hit');
    if (!cacheHit) {
      const data = await this.getWeeklySummary(siteId);
      const navbar = document.querySelector(selector);
      const cacheText = `Cache Ratio:  ${(data.cache_ratio * 100).toFixed(2)}%`;
      let cacheHit = crel(
        'span',
        {
          class: 'traffic-stat',
          id: 'pantheon-cache-hit',
          style: '',
        },
        cacheText,
      );
      navbar.prepend(cacheHit);
    }
  }

  // Get site traffic from platform API
  async getAggregations(siteId, duration) {
    duration = duration ?? '7d';

    let url = `/api/sites/${siteId}/environments/live/traffic?duration=${duration}`;
    let response = await fetch(url)
      .then(async (resp) => {
        if (resp.ok) {
          return await resp.json();
        }
        throw new Error('Network response was not ok.');
      })
      .catch((err) => {
        console.error(err);
      });
    return response;
  }

  async getWeeklySummary(siteId) {
    const data = await this.getAggregations(siteId, '14d').then((data) => {
      console.log(data);
      return data;
    });

    // Process timeseries
    const lastWeek = this.processWeeklySummary(data.timeseries.slice(0, 7));
    const thisWeek = this.processWeeklySummary(data.timeseries.slice(7, 14));

    console.log(thisWeek);

    const combinedData = {
      visits: thisWeek.visits,
      visits_change: (
        (thisWeek.visits - lastWeek.visits) /
        lastWeek.visits
      ).toFixed(4),
      pages_served: thisWeek.pages_served,
      pages_served_change: (
        (thisWeek.pages_served - lastWeek.pages_served) /
        lastWeek.pages_served
      ).toFixed(4),
      cache_ratio: thisWeek.cache_ratio_today,
      cache_change: (
        (thisWeek.cache_ratio_today - thisWeek.cache_ratio_yesterday) /
        thisWeek.cache_ratio_yesterday
      ).toFixed(4),
    };

    return combinedData;
  }

  /**
   *
   * @param {array} data
   * @returns
   */
  processWeeklySummary(data) {
    let total = {
      day_count: 0,
      pages_served: 0,
      visits: 0,
      cache_ratio: [],
      cache_hits: 0,
    };

    // Summarize all data.
    data.forEach((i) => {
      total.day_count++;
      total.pages_served += i.pages_served;
      total.visits += i.visits;
      total.cache_hits += i.cache_hits;
      const cache_ratio =
        i.pages_served == 0 ? 0 : (i.cache_hits / i.pages_served).toFixed(4);
      total.cache_ratio.push(cache_ratio);
    });

    // Prep additional data.
    total.cache_ratio_today = total.cache_ratio.slice(-1)[0];
    total.cache_ratio_yesterday = total.cache_ratio.slice(-2)[0];
    total.cache_ratio_max = Math.max.apply(null, total.cache_ratio);
    total.cache_ratio_min = Math.min.apply(null, total.cache_ratio);

    return total;
  }
}
