/**
 * Adding MySQL button
 */

export class ConnectionInfo {
  constructor() {
    this.addConnectionButton();
  }

  /**
   * Add connection button
   */
  addConnectionButton() {
    const connectionInfo = window.document.querySelector(
      "#connectionModal [aria-label='Connection Info']",
    );

    if (connectionInfo !== null) {
      const connectionHeaders = connectionInfo.querySelectorAll('h3');
      for (let h in connectionHeaders) {
        let el = connectionHeaders[h];
        if (el.innerText.includes('atabase')) {
          // Get column
          const dbConnection = el.nextElementSibling;
          const column = dbConnection.querySelector('.connectionModal-column');

          // Get database connection info.
          const inputs = dbConnection.querySelectorAll('input');
          console.log(inputs);
          let dbInfo = {};
          for (let i in inputs) {
            const input = inputs[i];
            dbInfo[input.id] = input.value;
          }

          console.log('dbinfo:', dbInfo);

          // Prepare field
          const mysqlField = connectionInfo
            .querySelector('div.connectionInfoField.sftpClient')
            .cloneNode(true);
          mysqlField.class = 'connectionInfoField mysqlClient';
          let mysqlLink = mysqlField.querySelector('a');
          mysqlLink.href = `mysql://${dbInfo.dbUsername}:${dbInfo.dbPassword}@${dbInfo.dbHost}:${dbInfo.dbPort}`;
          mysqlLink.innerHTML = mysqlLink.innerHTML.replace('SFTP', 'MySQL');

          // Add field
          column.prepend(mysqlField);

          // Break out.
          break;
        }
      }
    }
  }
}
