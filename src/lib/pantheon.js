/**
 * Pantheon helper functions.
 */

/**
 * Get proper name of workflow type.
 * @param {string} type
 * @returns string
 */
exports.getWorkflowName = (type) => {
  switch (type) {
    case "deploy":
      return "Deploy";
      break;
    case "deploy_product":
      return "Create new site";
      break;
    case "clear_cache":
      return "Clear Cache";
      break;
    case "clone_database":
      return "Clone database";
      break;
    case "sync_code":
    case "sync_code_with_build":
      return "Sync code commits";
      break;
    case "create_cloud_development_environment":
      return "Create multidev environment";
      break;
    case "autopilot_vrt":
      return "Autopilot VRT";
      break;
    default:
      return "Unknown workflow";
      break;
  }
};

exports.getMembershipUsers = (id) => {
  const users = window?.site?.userMemberships?.models;
  if (users !== undefined) {
    console.debug("membership users", users);
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.id == id) {
        console.log(`User found for ${id}`);
        return user.user;
      }
    }
  }
  console.error(`No user found for ${id}`);
  return null;
};

exports.siteNameChange = () => {
  const siteName = document.querySelector("span[class*='siteNameStyles']");
  siteName.contentEditable = true;
  siteName.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) {
      // 13 is enter
      var text = siteName.textContent;
      console.log(siteName);
      siteName.blur();
      alert(`Change site name to: ${text}`);
    }
  });
};
