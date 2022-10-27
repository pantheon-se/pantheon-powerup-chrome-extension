import '../styles/spectre.scss';
import '../styles/popup.scss';
import { getStorageData, setStorageData } from './storage';
import crel from 'crel';
const features = require('../static/features.json');

getStorageData().then((data) => {
  // Update features that have been added.
  const newData = Object.assign({}, data, features);
  setStorageData(newData);
  const featureListEl = document.getElementById('feature-list');

  for (const i in data) {
    const feature = data[i];
    console.log(feature);

    const inputCheck = crel(
      'div',
      { class: 'form-group' },
      crel(
        'label',
        { class: 'form-switch' },
        crel(
          'input',
          {
            id: i,
            type: 'checkbox',
            checked: feature.value,
          },
          '',
        ),
      ),
    );

    console.log(inputCheck);

    featureListEl.append(inputCheck);
  }

  // <div class="form-group">
  //   <label class="form-switch">
  //     <input type="checkbox" />
  //     <i class="form-icon"></i>
  //     Send me emails with news and tips
  //   </label>
  // </div>

  console.log(data);
});
