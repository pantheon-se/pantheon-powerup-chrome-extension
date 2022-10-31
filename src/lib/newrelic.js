import Chart from 'chart.js/auto';
import crel from 'crel';
import nrTemplate from '../template/newrelic.html';
import _ from 'lodash';

/**
 * New Relic utilities
 */
export class NewRelic {
  constructor(siteId) {
    this.siteId = siteId;
    this.api_key = null;
    this.account_id = null;
    this.name = null;
    this.valid = false;
    this.runtime = chrome.runtime; // eslint-disable-line no-undef
    this.graphql_key = 'NRAK-'; // ADD REAL ONE
    this.app = null;
    this.metricCharts = ['web_response', 'throughput', 'host_memory', 'apdex'];
  }

  async getNewRelicKey(env) {
    env = env || 'dev';
    let url = `/api/sites/${this.siteId}/environments/${env}/bindings?type=newrelic`;
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

    if (Object.keys(response).length > 0) {
      Object.entries(response).forEach((data) => {
        const binding = data[1];
        if (binding.type == 'newrelic') {
          this.account_id = binding.account.id;
          this.api_key = binding.account.api_key;
          this.name = binding.account.name;
          this.valid = true;
        }
      });
    } else {
      console.log('New Relic not available.');
    }
    return this;
  }

  /**
   * Common fetch utility for JSON data.
   * @param {*} url
   * @param {*} options
   * @returns
   */
  async fetchJson(url, options) {
    return await fetch(url, options)
      .then(async (resp) => {
        if (resp.ok) {
          return await resp.json();
        }
        throw new Error('Network response was not ok. ' + resp.statusText);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  /**
   * New Relic GraphQL API
   * @param {*} body
   * @returns
   */
  async newrelicGraphqlRequest(body) {
    const message = {
      newrelic: true,
      url: 'https://api.newrelic.com/graphql',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.graphql_key,
        },
        body: body,
      },
    };

    return await this.runtime.sendMessage(message);
  }

  /**
   *
   */
  async getNewRelicEntities() {
    const query = `{
      actor {
        entitySearch(queryBuilder: {domain: APM}) {
          results {
            entities {
              guid
              name
              accountId
            }
          }
        }
      }
    }`;
    const body = JSON.stringify({ query: query });
    return await this.newrelicGraphqlRequest(body);
  }

  /**
   * Get all New Relic Applications
   */
  async getNewRelicApplications() {
    const message = {
      newrelic: true,
      url: 'https://api.newrelic.com/v2/applications.json',
      options: {
        headers: {
          'X-Api-Key': this.api_key,
        },
      },
    };

    return await this.runtime.sendMessage(message);
  }

  /**
   * Get a single application based on the environment.
   * @param {*} env
   * @returns
   */
  async getNewRelicApplication(env) {
    const data = await this.getNewRelicApplications();
    const name = `${this.name} (${env})`;
    const app = data.applications.find((obj) => {
      return obj.name === name;
    });
    console.log('application', app);
    this.app = app;
    return app;
  }

  /**
   *
   * @param {*} appId
   * @param {*} metric
   * @returns
   */
  async getApplicationMetrics(metric) {
    const metrics = {
      web_response: 'names[]=HttpDispatcher&values[]=average_response_time',
      throughput: 'names[]=HttpDispatcher&values[]=requests_per_minute',
      host_memory: 'names[]=Memory/Physical&values[]=used_mb_by_host',
      apdex: 'names[]=Apdex&names[]=EndUser/Apdex&values[]=score',
    };

    // Don't be empty.
    metric = Object.keys(metrics).includes(metric) ? metric : 'web_response';

    const message = {
      newrelic: true,
      url: `https://api.newrelic.com/v2/applications/${this.app.id}/metrics/data.json`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-Api-Key': this.api_key,
        },
        body: metrics[metric],
      },
    };

    return await this.runtime.sendMessage(message);
  }

  /**
   *
   */
  async getInsightData() {
    const guid = btoa(`${this.account_id}|APM|APPLICATION|${this.app.id}`);
    const query = `SELECT rate(count(apm.service.transaction.duration), 1 minute) as 'Web throughput' FROM Metric WHERE (entity.guid = '${guid}') AND (transactionType = 'Web') LIMIT MAX SINCE 1800 seconds AGO TIMESERIES`;
    const insights = await this.getInsightsApi(query);
    console.log(insights);
  }

  /**
   * Get chart data from Insights API.
   * @param {*} qs Query string
   * @returns
   */
  async getInsightsApi(qs) {
    const query = encodeURIComponent(qs);
    const message = {
      newrelic: true,
      url: `https://insights-api.newrelic.com/v1/accounts/${this.account_id}/query?nrql=${query}`,
      options: {
        headers: {
          Accept: 'application/json',
          'X-Query-Key': 'NRIQ-gYIsJF_mdHQPGBshxxR5LGEeVl3XIn8d',
        },
      },
    };

    return await this.runtime.sendMessage(message);
  }

  /**
   * Get embedded and static chart data.
   * @param {*} chart
   * @returns
   */
  async getNewRelicChartGraphql(chart) {
    const guid = btoa(`${this.account_id}|APM|APPLICATION|${this.app.id}`);
    const type = chart == 'web' ? 'AREA' : 'APDEX';
    chart = chart || 'web';
    const charts = {
      web: `SELECT filter(average(apm.service.overview.web * 1000), WHERE segmentName like 'PHP') as 'PHP',filter(average(apm.service.overview.web * 1000), WHERE segmentName like 'MySQL') as 'MySQL',filter(average(apm.service.overview.web * 1000), WHERE segmentName like 'Redis') as 'Redis',filter(average(apm.service.overview.web * 1000), WHERE segmentName like 'Web external') as 'Web external' FROM Metric WHERE (entity.guid = '${guid}') LIMIT MAX SINCE 1800 seconds AGO TIMESERIES `,
      throughput: `SELECT rate(count(apm.service.transaction.duration), 1 minute) as 'Web throughput' FROM Metric WHERE (entity.guid = '${guid}') AND (transactionType = 'Web') LIMIT MAX SINCE 1800 seconds AGO TIMESERIES `,
      apdex: `SELECT apdex(apm.service.apdex) as 'App server', apdex(apm.service.apdex.user) as 'End user' FROM Metric WHERE (entity.guid = '${guid}') LIMIT MAX SINCE 1800 seconds AGO TIMESERIES `,
    };

    const query = `{
      actor {
        account(id: ${this.account_id}) {
          nrql(query: "${charts[chart]}") {
            embeddedChartUrl(chartType: ${type})
            staticChartUrl
          }
        }
      }
    }`;

    const body = JSON.stringify({ query: query });
    console.log('graphql body', body);
    return await this.newrelicGraphqlRequest(body);
  }

  /**
   *
   * @param {*} data
   * @returns
   */
  prepareTimeSeriesChart(data) {
    let metrics = data.metric_data.metrics[0].timeslices;
    let metric_labels = [];
    let metric_values = [];
    const type = Object.keys(
      data.metric_data.metrics[0].timeslices[0].values,
    )[0];
    metrics.forEach((metric) => {
      metric_labels.push(metric.from);
      metric_values.push(metric.values[type]);
    });

    console.log(type);
    const labels = {
      average_response_time: {
        label: 'Avg Response Time (ms)',
        unit: 'ms',
        title: 'Average Response Time',
        config: {},
      },
      requests_per_minute: {
        label: 'Req / min',
        unit: '/min',
        title: 'Throughput',
        config: {},
      },
      score: {
        label: 'Apdex Score',
        unit: '',
        title: 'Apdex Score',
        config: {
          options: {
            scales: {
              y: [
                {
                  ticks: {
                    min: 0,
                    max: 100,
                    callback: function (value) {
                      return value + '%';
                    },
                  },
                  scaleLabel: {
                    display: true,
                    labelString: 'Percentage',
                  },
                },
              ],
              x: {
                display: false, // Hide X axis labels
              },
            },
          },
        },
      },
      used_mb_by_host: {
        label: 'Memory (Mb)',
        unit: 'Mb',
        title: 'Memory by Host',
        config: {},
      },
    };

    console.log(type, data);

    let chartContainer = crel('canvas', { class: 'traffic-chart-' + type });
    chartContainer.style = 'max-height: 400px, min-height: 200px';

    // Append access chart to container.
    const defaultConfig = {
      type: 'line',
      data: {
        labels: metric_labels,
        datasets: [
          {
            label: labels[type]['label'],
            data: metric_values,
            backgroundColor: '#54ACEF',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: false, // Hide legend
          title: {
            display: true,
            text: labels[type]['title'],
          },
        },
        elements: {
          line: {
            tension: 0.4, // smooth lines
          },
        },
        scales: {
          y: {
            //   display: false, // Hide Y axis labels
            min: 0,
          },
          x: {
            display: false, // Hide X axis labels
          },
        },
        tooltips: {
          callbacks: {
            label: (item) => `${item.yLabel} ${labels[type]['unit']}`,
          },
        },
      },
    };
    const mergedConfig = _.merge(defaultConfig, labels[type]['config']);
    new Chart(chartContainer, mergedConfig);

    return chartContainer;
  }

  /**
   *
   * @param {*} regionSelector
   * @param {*} env
   */
  async prepareChartArea(regionSelector, env) {
    // Prepare Template space
    const app = await this.getNewRelicApplication(env);
    console.log(app);
    var template = document.createElement('template');
    template.innerHTML = nrTemplate;

    // Move form button
    const form = regionSelector.querySelector('#sso-form');
    form.style = 'float: right;';
    form.querySelector('button').style = 'margin-top: 22px;';
    template.content.querySelector('#new-relic-sso-form').append(form);

    // Add status health metrics
    const statusHealth = {
      health: {
        value: app.health_status,
        unit: '',
        label: 'Site Health',
      },
      response_time: {
        value: (app.application_summary.response_time / 100).toFixed(2),
        unit: 'sec',
        label: 'Response Time',
      },
      apdex_score: {
        value: app.application_summary.apdex_score,
        unit: '%',
        label: 'Apdex Score',
      },
      throughput: {
        value: app.application_summary.throughput,
        unit: 'req/m',
        label: 'Throughput',
      },
    };
    for (const i in statusHealth) {
      const itemSlot = template.content.querySelector('#new-relic-status-' + i);
      console.log('item', itemSlot);

      let text = statusHealth[i]['value'] + ' ' + statusHealth[i]['unit'];
      if (i == 'health') {
        let value = 'Unknown';
        let btnClass = 'info';
        switch (statusHealth[i]['value']) {
          case 'green':
            value = 'Good';
            btnClass = 'success';
            break;
          case 'orange':
          case 'yellow':
            value = 'Unhealthy';
            btnClass = 'warning';
            break;
        }
        text = crel(
          'p',
          crel('button', { class: 'btn btn-' + btnClass }, value),
        );
      }
      const label = crel(
        'strong',
        statusHealth[i]['label'],
        crel('p', { style: 'font-size: 22px' }, text),
      );
      itemSlot.append(label);
    }

    // Clear out and reload template.
    regionSelector.innerHTML = '';
    regionSelector.append(template.content);

    // Get charts / data
    this.metricCharts.forEach(async (metric) => {
      const metrics = await this.getApplicationMetrics(metric);
      const chart = this.prepareTimeSeriesChart(metrics);
      const chartHolder = document.querySelector('#new-relic-chart-' + metric);
      chartHolder.style = 'min-height: 200px; margin-bottom: 22px;';
      if (metric == 'web_response') {
        chartHolder.style = 'min-height: 400px; margin-bottom: 22px;';
      }
      chartHolder.append(chart);
    });
  }

  // async chartData() {
  //   response['newrelic'] = await getNewRelicData(response.site.id);
  //   let application = response?.newrelic?.application;
  //   if (application !== undefined) {
  //     /*
  //               {
  //                   "response_time": 6.89,
  //                   "throughput": 2,
  //                   "error_rate": 0,
  //                   "apdex_target": 0.5,
  //                   "apdex_score": 1,
  //                   "host_count": 3,
  //                   "instance_count": 3
  //               }
  //               */
  //     let health = response.newrelic.application.health_status;
  //     let host_count =
  //       response.newrelic.application.application_summary.host_count;
  //     let response_time = (
  //       response.newrelic.application.application_summary.response_time / 1000
  //     ).toFixed(2);
  //     let metrics = response.newrelic.metric_data.metrics[0].timeslices;
  //     let metric_labels = [];
  //     let metric_values = [];
  //     metrics.forEach((metric) => {
  //       metric_labels.push(metric.from);
  //       metric_values.push(metric.values.average_response_time);
  //     });

  //     let nr_box = addElement('nr-health-' + response.id, 'div');
  //     let nr_content = `
  //               <ul>
  //                   <li>Health: ${health}</li>
  //                   <li>Hosts: ${host_count}</li>
  //                   <li>Response: ${response_time} sec.</li>
  //               </ul>
  //             `;
  //     nr_box.innerHTML = nr_content;

  //     // Get site row
  //     let site_selector = `.js-sites-table table tr a[href$="/sites/${response.id}"]`;
  //     let status_box = document.querySelector(site_selector);
  //     if (status_box !== null) {
  //       status_box.appendChild(nr_box);

  //       let accessChartContainer = addElement(
  //         'traffic-chart-' + response.id,
  //         'canvas',
  //       );
  //       accessChartContainer.style = 'max-height: 100px';

  //       // Append access chart to container.
  //       new Chart(accessChartContainer, {
  //         type: 'line',
  //         data: {
  //           labels: metric_labels,
  //           datasets: [
  //             {
  //               label: 'Avg Response Time',
  //               data: metric_values,
  //               backgroundColor: '#54ACEF',
  //             },
  //           ],
  //         },
  //         options: {
  //           maintainAspectRatio: false,
  //           plugins: {
  //             legend: false, // Hide legend
  //           },
  //           scales: {
  //             y: {
  //               //   display: false, // Hide Y axis labels
  //             },
  //             x: {
  //               display: false, // Hide X axis labels
  //             },
  //           },
  //         },
  //       });

  //       status_box.after(accessChartContainer);
  //     }
  //   }
  // }
}
