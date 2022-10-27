const pantheon = require('./pantheon');
const domHelper = require('./domobserver').default;
const dom = new domHelper();

/**
 * quicksilver_post_tasks
 * quicksilver_pre_tasks
 */

class Workflows {
  constructor() {
    this.siteId = window?.site?.attributes?.id;
    if (this.siteId == undefined) {
      this.siteId = window.location.pathname.split('/')[2];
    }
    this.url = `/api/sites/${this.siteId}/workflows?hydrate=operations_with_logs`;
    this.workflows = {};
  }

  /**
   * Main function for getting QS logs.
   */
  async getQuicksilverLogs() {
    this.quicksilverOperations = [];
    await this.getWorkflowLogs().then((data) => {
      let workflows = this.filterQuicksilverLogs(data);
      if (workflows?.length && workflows.length > 0) {
        workflows.forEach((workflow) => {
          if (
            workflow.has_operation_log_output &&
            workflow?.operations !== undefined
          ) {
            for (let i = 0; i < workflow.operations.length; i++) {
              let op = workflow.operations[i];
              if (op.type == 'quicksilver') {
                // Add workflow data to operation.
                op['wf_active_description'] = workflow.active_description;
                op['wf_description'] = workflow.description;
                op['wf_environment'] = workflow.environment;
                op['wf_type'] = workflow.type;
                op['wf_type_name'] = pantheon.getWorkflowName(workflow.type);
                op['wf_user_id'] = workflow.user_id;
                op['wf_user'] = 'Pantheon';
                op['wf_runtime'] = String(op.run_time.toFixed(2)) + 's';

                // Get readable date
                let wfDate = new Date(workflow.created_at * 1000);
                const d = wfDate.getDate();
                const M = wfDate.getMonth() + 1;
                const Y = wfDate.getFullYear();
                const h = wfDate.getHours();
                const m = wfDate.getMinutes();
                const s = wfDate.getSeconds();
                op['wf_date'] = `${M}/${d}/${Y} ${h}:${m}:${s}`;

                let wfUser = pantheon.getMembershipUsers(workflow.user_id);
                if (wfUser !== null) {
                  op['wf_user'] = wfUser.profile.attributes.full_name;
                }

                // Get all operations.
                this.quicksilverOperations.push(op);
              }
            }
          }
        });
      }
    });
    console.log('qs operations', this.quicksilverOperations);
    return this.quicksilverOperations;
  }

  /**
   * Wrapper to fetch logs.
   */
  async getWorkflowLogs() {
    this.workflows = await fetch(this.url)
      .then(
        (response) => response.json(),
        (err) => console.error,
      )
      .then((data) => {
        return data;
      });
    return this.workflows;
  }

  /**
   * Filter out Quicksilver logs
   */
  filterQuicksilverLogs(logs) {
    return logs.filter(
      (log) =>
        log.hasOwnProperty('quicksilver_post_tasks') ||
        log.hasOwnProperty('quicksilver_pre_tasks'),
    );
  }

  formatRow(d) {
    // `d` is the original data object for the row
    return (
      '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
      '<tr>' +
      '<td><pre>' +
      d.log_output +
      '</pre></td>' +
      '</tr>' +
      '</table>'
    );
  }

  generateDataTable(data) {
    const formatRow = this.formatRow;

    let headers = [
      {
        name: 'Date',
        prop: 'wf_date',
      },
      {
        name: 'Workflow',
        prop: 'wf_type_name',
      },
      {
        name: 'Environment',
        prop: 'environment',
      },
      {
        name: 'Description',
        prop: 'description',
      },
      {
        name: 'Result',
        prop: 'result',
      },
      {
        name: 'Runtime',
        prop: 'wf_runtime',
      },
      {
        name: 'User',
        prop: 'wf_user',
      },
    ];

    let columns = [
      {
        className: 'dt-control',
        orderable: false,
        data: null,
        defaultContent: '',
      },
    ];

    let thColumns = [];

    // Prepare data
    headers.forEach((header) => {
      columns.push({ data: header.prop, title: header.name });
      thColumns.push(`<th>${header.name}</th>`);
    });

    console.log('datatable columns', columns);

    let jqElement = jQuery('<table>');

    let table = jqElement.DataTable({
      data: data,
      columns: columns,
      order: [[1, 'desc']],
    });

    // Add event listener for opening and closing details
    jQuery('tbody', jqElement).on('click', 'td.dt-control', function () {
      let tr = $(this).closest('tr');
      let row = table.row(tr);

      if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
      } else {
        // Open this row
        row.child(formatRow(row.data())).show();
        tr.addClass('shown');
      }
    });

    return jqElement;
  }
}

exports.Workflows = Workflows;

/**
 * DEPRECATED
 * Analyze quicksilver scripts
 * @param {*} data
 * @returns
 */
async function analyzeWorkflow(data, siteId) {
  console.log(data);

  let qs = [];
  const qsTemplate = {
    id: 'Workflow ID',
    created_at: 'Time',
    qs_name: 'Job',
    type: 'Trigger',
    result: 'Status',
    total_time: 'Runtime',
  };

  // Extract Quicksilver hooks
  for (let i in data) {
    let task = data[i];

    //      console.log(task);
    // Specifically look for Quicksilver tasks
    if (
      task.hasOwnProperty('final_task') &&
      task.final_task.fn_name === 'queue_swf_task'
    ) {
      // Add item to Quicksilver list
      qs.push({
        id: task.id,
        type: task.type,
        result: task.final_task.result,
        created_at: task.final_task.created_at,
        qs_name: task.final_task.description,
        run_time: task.final_task.run_time,
      });
    }
  }

  // Create table
  let qsTable = dom.createTable(
    'qs-report',
    ['Job', 'Date', 'Run Time', 'Status'],
    true,
    'table table-bordered table-striped',
  );

  // Add colspans
  var theadCells = qsTable.querySelectorAll('thead td');
  theadCells[0].setAttribute('colspan', 4);
  theadCells[1].setAttribute('colspan', 2);
  theadCells[2].setAttribute('colspan', 1);
  theadCells[2].classList.add('text-center');
  theadCells[3].setAttribute('colspan', 1);
  theadCells[3].classList.add('text-center');

  // Loop through Quicksilver WF data
  let wf_count = 0;
  for (let idx in qs) {
    if (wf_count > 30) {
      break;
    }
    wf_count++;
    let item = qs[idx];

    let row = qsTable.getElementsByTagName('tbody')[0].insertRow();

    // Add Job
    var jobCell = row.insertCell();
    var eventType = pantheon.getWorkflowName(item.type);
    jobCell.innerHTML = `<big>${item.qs_name}</big><br><small><strong>Event</strong>: ${eventType}</small>`;
    jobCell.className = 'qs_name';
    jobCell.setAttribute('colspan', 4);

    // Add Date
    var dateCell = row.insertCell();
    var date = new Date(item.created_at * 1000);
    dateCell.innerHTML = date.toLocaleDateString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    dateCell.className = 'created_at';
    dateCell.setAttribute('colspan', 2);

    // Add Runtime
    var timeCell = row.insertCell();
    timeCell.innerHTML = item.run_time.toFixed(2) + 's';
    timeCell.className = 'run_time text-center';
    timeCell.setAttribute('colspan', 1);

    // Add Status
    var statusCell = row.insertCell();
    console.log('result', item.result);
    statusCell.innerHTML =
      item.result === 'succeeded'
        ? "<span class='badge badge-success' style='font-size: 1.25em;'><i class='fa fa-check-circle-o fa-lg'></i></span>"
        : "<span class='badge badge-warning' style='font-size: 1.25em;'><i class='fa fa-ban fa-lg'></i></span>";
    statusCell.className = 'result text-center';
    statusCell.setAttribute('colspan', 1);
  }

  return qsTable;
}
