/**
 * List of helpful utility functions.
 */

class Utilities {
  /**
   * Helper function for capitalizing words.
   * @param {string} word
   * @returns string
   */
  capitalize(word) {
    const lower = word.toLowerCase();
    return word.charAt(0).toUpperCase() + lower.slice(1);
  }

  /**
   *
   * @param {string} date
   * @param {*} score
   * @returns
   */
  lighthouseRow(date, score) {
    score = score || this.getScore();
    var badge = this.getBadgeClass(score);
    var row = [];
    row.push(date);
    row.push("https://dev-example-site-1.pantheonsite.io");
    row.push('<span class="badge badge-' + badge + '">' + score + "</span>");
    row.push(
      '<a target="_blank" href="https://googlechrome.github.io/lighthouse/viewer/?gist=e5891e64bde91858d193cc41b3929eb7" class="btn btn-default">View Report</a>'
    );

    return row;
  }

  /**
   *
   * @param {*} num
   * @returns
   */
  getBadgeClass(num) {
    var badge = "danger";
    if (num >= 90) {
      badge = "success";
    } else if (num < 90 && num >= 60) {
      badge = "warning";
    }
    return badge;
  }

  getTraffic(low, high) {
    low = low || 10000;
    high = high || 75000;
    return this.randomIntFromInterval(low, high);
  }

  getScore() {
    return this.randomIntFromInterval(70, 100);
  }

  randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  randomString() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  getDates(start, increment) {
    start = start || -5;
    increment = increment || 1;
    start = start - (start % increment);
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (var days = [], i = start; i < 1; i += increment) {
      var day = new Date();
      day.setDate(day.getDate() + i);
      var frm = months[day.getMonth()] + " " + day.getDate();
      days.push(frm);
    }
    return days;
  }
}

export default new Utilities();
