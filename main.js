//chunk: {hours, minutes, seconds}
//percentChunk: {percentPos, label }

const runExtension = () => {
  console.log('Youtube time markers chrome extension running.');

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
    return (calcSecondsSum(chunk) / sum) * 100;
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
    const children = chunks.map(({ percentPos, label }) => {
      const childStyle = percentPos > 50 ? 'style="right: 0%"' : 'style="left: 0%"';
      return `
          <div class="repo-ext-yt-mark" style="left: ${percentPos}%">
            <div class="repo-ext-yt-mark-popup" ${childStyle}>
              ${label}
            </div>
          </div>
        `;
    });
    container.innerHTML = children;
  };

  document.querySelectorAll('.repo-ext-yt-container').forEach(node => node.remove());

  waitForYt().then(() => {
    const durationStr = document.getElementsByClassName('ytp-time-duration')[0].innerText;


    const { hours, minutes, seconds } = extractTime(durationStr);



    const secondsSum = calcSecondsSum({
      hours,
      minutes,
      seconds
    });
    const desc = document.getElementById('description').innerText;
    const regexp = /(\d\d:\d\d:\d\d.*)/gm;

    let lines = [];
    let line = [];
    while ((line = regexp.exec(desc)) !== null) {
      lines = [...lines, line[1]];
    }
    const chunksStrings = lines.map(line => {
      const lineRegExp = /\s*([\w:]+)\s.*?(.*)/;
      if (!lineRegExp.test(line)) {
        throw new Error("Line doesnt meet regexp:" + line);
      }
      const matches = lineRegExp.exec(line);
      return {
        at: matches[1].trim(),
        label: matches[2].trim()
      };
    });

    const percentChunks = chunksStrings.map(createTimeStamp(secondsSum));


    appendMarks(percentChunks);
  });
}

runExtension();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === 'URL_CHANGE') {
      runExtension();
    }
});
