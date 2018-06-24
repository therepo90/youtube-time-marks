//chunk: {hours, minutes, seconds}
//percentChunk: {percentPos, label }

console.log('repo-ext-markers init');

const extractTime = timeStr => {
  let hours;
  let minutes;
  let seconds;
  const groups = timeStr.split(":");
  if (groups.length == 3) {
    hours = Number(groups[0]);
    minutes = Number(groups[1]);
    seconds = Number(groups[2]);
  } else if (groups.length == 2) {
    hours = 0;
    minutes = Number(groups[0]);
    seconds = Number(groups[1]);
  } else {
    throw new Error('Time group in wrong format ', timeStr);
  }

  return {
    hours,
    minutes,
    seconds
  };
};

const createTimeStamp = secondsSum => chunk => {
  return {
    percentPos: toPercentTime(secondsSum)(extractTime(chunk.at)),
    label: chunk.label 
  }
};
const calcSecondsSum = ({ hours, minutes, seconds }) => seconds + minutes * 60 + hours * 3600;
const toPercentTime = sum => chunk => {
  return (calcSecondsSum(chunk) / sum)*100;
}

const waitMiliseconds = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const waitForYt = async () => {
  let tries = 0;
  while (true) {
    await waitMiliseconds(1000);
    if (document.getElementsByClassName('ytp-time-duration')[0]) {
      break;
    }
    tries++;
    if (tries > 5) {
      throw new ('Too many tries, no element present');
    }
  }
};

const appendMarks = chunks => {
  // append container
  const bar = document.getElementsByClassName('ytp-progress-bar-container')[0];
  const container = document.createElement('div');
  container.classList.add('repo-ext-yt-container');
  bar.appendChild(container);

  // append marks
  const children = chunks.map(({percentPos, label}) => {
        return `
          <div class="repo-ext-yt-mark" style="left: ${percentPos}%">
            <div class="repo-ext-yt-mark-popup">
              ${label}
            </div>
          </div>
        `;
  });
  console.log('children', children);
  container.innerHTML = children;
};

waitForYt().then(() => {
  const durationStr = document.getElementsByClassName('ytp-time-duration')[0].innerText;


  const { hours, minutes, seconds } = extractTime(durationStr);


  console.log('time', hours, minutes, seconds);

  const secondsSum = calcSecondsSum({
    hours,
    minutes,
    seconds
  });
  // TODO extract chunks from description
  const desc = document.getElementById('description').innerText;
  console.log(desc);
  const chunksStrings = [{
    at: '2:40:00',
    label: 'Sample label' 
  }];

  const percentChunks = chunksStrings.map(createTimeStamp(secondsSum));
  console.log('chunks', percentChunks);

  appendMarks(percentChunks);
});

