/**
 * New Relic utilities
 */

/**
 * Get New Relic Site Data
 * @param {*} site_id
 * @returns
 */
async function getNewRelicData(site_id) {
  let url = `/api/sites/${site_id}/environments/live/bindings?type=newrelic`;
  let response = await fetch(url)
    .then(async (resp) => {
      if (resp.ok) {
        return await resp.json();
      }
      throw new Error('Network response was not ok.');
    })
    .catch((err) => console.error);

  // Fix New Relic API response
  if (Object.keys(response).length > 0) {
    let keys = Object.keys(response);
    let nr_data = response[keys[0]];

    await fetch('https://api.newrelic.com/v2/applications.json', {
      body: 'filter[name]=(live)',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Api-Key': nr_data.api_key,
      },
      method: 'POST',
    })
      .then(async (resp) => {
        if (resp.ok) {
          let data = await resp.json();
          if (data.applications.length > 0) {
            let app = data.applications[0];
            response['application'] = app;

            // Get web transaction time data
            await fetch(
              `https://api.newrelic.com/v2/applications/${app.id}/metrics/data.json`,
              {
                body: 'names[]=HttpDispatcher&values[]=average_response_time',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'X-Api-Key': nr_data.api_key,
                },
                method: 'POST',
              },
            )
              .then(async (resp) => {
                if (resp.ok) {
                  let data = await resp.json();
                  if (Object.keys(data.metric_data).length > 0) {
                    response['metric_data'] = data.metric_data;
                  }
                }
                throw new Error('Network response was not ok.');
              })
              .catch((err) => console.error);
          }
        }
        throw new Error('Network response was not ok.');
      })
      .catch((err) => console.error);
  }

  return response;
}

async function chartData() {
  response['newrelic'] = await getNewRelicData(response.site.id);
  let application = response?.newrelic?.application;
  if (application !== undefined) {
    /*
                {
                    "response_time": 6.89,
                    "throughput": 2,
                    "error_rate": 0,
                    "apdex_target": 0.5,
                    "apdex_score": 1,
                    "host_count": 3,
                    "instance_count": 3
                }
                */
    let health = response.newrelic.application.health_status;
    let host_count =
      response.newrelic.application.application_summary.host_count;
    let response_time = (
      response.newrelic.application.application_summary.response_time / 1000
    ).toFixed(2);
    let metrics = response.newrelic.metric_data.metrics[0].timeslices;
    let metric_labels = [];
    let metric_values = [];
    metrics.forEach((metric) => {
      metric_labels.push(metric.from);
      metric_values.push(metric.values.average_response_time);
    });

    let nr_box = addElement('nr-health-' + response.id, 'div');
    let nr_content = `
                <ul>
                    <li>Health: ${health}</li>
                    <li>Hosts: ${host_count}</li>
                    <li>Response: ${response_time} sec.</li>
                </ul>
              `;
    nr_box.innerHTML = nr_content;

    // Get site row
    let site_selector = `.js-sites-table table tr a[href$="/sites/${response.id}"]`;
    let status_box = document.querySelector(site_selector);
    if (status_box !== null) {
      status_box.appendChild(nr_box);

      let accessChartContainer = addElement(
        'traffic-chart-' + response.id,
        'canvas',
      );
      accessChartContainer.style = 'max-height: 100px';

      // Append access chart to container.
      new Chart(accessChartContainer, {
        type: 'line',
        data: {
          labels: metric_labels,
          datasets: [
            {
              label: 'Avg Response Time',
              data: metric_values,
              backgroundColor: '#54ACEF',
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: false, // Hide legend
          },
          scales: {
            y: {
              //   display: false, // Hide Y axis labels
            },
            x: {
              display: false, // Hide X axis labels
            },
          },
        },
      });

      status_box.after(accessChartContainer);
    }
  }
}
