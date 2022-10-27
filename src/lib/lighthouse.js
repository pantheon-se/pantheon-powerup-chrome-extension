/**
 * Lighthouse examples
 */

const domHelperClass = require('./domobserver').default;
const domHelper = new domHelperClass();
const utils = require('../lib/utils').default;

class Lighthouse {
  constructor() {}

  addReportTable(domContainer) {
    var newTableContainer = domHelper.createTable(
      'lighthouse-table',
      ['Date', 'URL', 'Score', 'Link'],
      true,
    );
    domContainer.after(newTableContainer);

    var dates = utils.getDates();
    var tabledata = [];
    for (var dt = dates.length - 1; dt >= 0; dt--) {
      var last = dates.length - 1;
      var score = dt == last ? 100 : null;
      tabledata.push(utils.lighthouseRow(dates[dt], score));
    }

    var datatable = new DataTable(newTableContainer, {
      data: tabledata,
      columnDefs: [
        {
          targets: '_all',
          className: 'text-center',
        },
      ],
    });

    var title = domHelper.addElement('table-title', 'h3');
    title.appendChild(
      document.createTextNode('Lighthouse Performance Reports'),
    );
    title.style = '';
    newTableContainer.before(title);
  }
}

export default new Lighthouse();
