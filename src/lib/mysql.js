/**
 * Adding MySQL button
 */

class mysql {
  constructor() {}

  /**
   * Add connection button
   */
  addConnectionButton() {
    var connectionInfo = window.document.querySelector(
      "[aria-label='Connection Info']"
    );
    var cObj = {};
    var checkDb = false;
    var dbAnchor = null;
    var dbIndex = 0;
    var dbEl = null;

    console.log(connectionInfo);
    if (connectionInfo !== null) {
      var connectArr = Array.from(connectionInfo.children);
      for (var ind in connectArr) {
        var el = connectArr[ind];
        if (el.innerText.includes("atabase")) {
          dbIndex = ind;
          dbEl = el;
          break;
        }
      }

      // Get connection
      var curr = null;
      for (var l = 0; l < 6; l++) {
        curr = curr !== null ? curr : dbEl;
        console.log(curr);
        switch (l) {
          case 1:
            dbAnchor = curr.querySelector("label");
            break;
          case 2:
            cObj.host = this.getValue(curr);
            break;
          case 3:
            cObj.username = getValue(curr);
            break;
          case 4:
            cObj.password = getValue(curr);
            break;
          case 5:
            cObj.port = getValue(curr);
            break;
          case 6:
            cObj.db = getValue(curr);
            break;
        }
        // Increment curr
        curr = curr.nextSibling;
      }

      console.log(cObj);

      // Create DB link
      var dbLink = document.createElement("a");
      // Create the text node for anchor element.
      var linkT = "Open in MySQL client";
      var link = document.createTextNode(linkT);

      // Add link
      dbLink.appendChild(link);
      dbLink.class = "mysql-quick-connect";
      dbLink.style = "margin-bottom: 15px;display: inline-block;";
      dbLink.title = linkT;
      dbLink.href = `mysql://${cObj.username}:${cObj.password}@${cObj.host}:${cObj.port}`;
      var dBreak = document.createElement("br");
      dbAnchor.after(dbLink);
      dbAnchor.after(dBreak);
    }
  }

  getValue(el) {
    return el.querySelector("input").value;
  }
}

export default mysql;
