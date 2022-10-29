// Get Window data to content scripts.
function ensureSiteIsSet(timeout) {
  var start = Date.now();
  return new Promise(waitForSite); // set the promise object within the ensureFooIsSet object
  function waitForSite(resolve, reject) {
    if (window.site) resolve(window.site);
    else if (timeout && Date.now() - start >= timeout)
      reject(new Error('timeout'));
    else setTimeout(waitForSite.bind(this, resolve, reject), 30);
  }
}

function toJSON(proto) {
  let jsoned = {};
  const allowedTypes = ['object', 'string', 'number', 'boolean', 'array'];
  const restricted = ['caller', 'callee', 'arguments'];
  try {
    if (allowedTypes.includes(typeof proto)) {
      Object.getOwnPropertyNames(proto).forEach((prop) => {
        // Only allow the following
        const val = proto[prop];
        if (
          !allowedTypes.includes(typeof val) ||
          (restricted.includes(prop) && prop.startsWith('_'))
        ) {
          console.log('rejected', typeof val);
          return;
        }
        jsoned[prop] = val;
      });

      // const inherited = Object.getPrototypeOf(proto);
      // if (inherited !== null) {
      //   Object.keys(toJSON(inherited)).forEach((key) => {
      //     if (!!jsoned[key] || key === 'constructor' || key === 'toJSON')
      //       return;
      //     if (typeof inherited[key] === 'function') {
      //       jsoned[key] = inherited[key].bind(jsoned);
      //       return;
      //     }
      //     jsoned[key] = inherited[key];
      //   });
      // }
    }
  } catch (error) {
    // console.error(error);
    console.log('error', proto);
  }
  return jsoned;
}

var timeout = 100000; // 100000ms = 100 seconds
// ensureSiteIsSet(timeout).then(function () {
//   // let site = toJSON(window.site);

//   let site = {};
//   const props = [
//     'accountTier',
//     'add_ons',
//     'attributes',
//     'currentPlan',
//     'environments',
//     'newrelic',
//     'settings',
//     'siteAttributes',
//     'siteSettings',
//     'workflows',
//   ];
//   for (const i in window.site) {
//     if (props.includes(i)) {
//       site[i] = JSON.parse(JSON.stringify(window.site[i]));
//       if (i == 'environments') {
//         for (const model in window.site[i].models) {
//           site[i][model]['bindings'] = [];
//           for (const bind in window.site[i].models[model].bindings.models) {
//             console.log('bind', bind);
//             site[i][model]['bindings'].push(
//               JSON.parse(
//                 JSON.stringify(window.site[i].models[model].bindings[bind]),
//               ),
//             );
//           }
//         }
//       }
//     }
//   }

//   console.log('site deep', site);
//   // WIP, will figure out later
//   // window.postMessage({
//   //   from: 'webAccessibleResources.js',
//   //   data: site,
//   // });
// });
