const API_KEY = '1983b495da8f0c848fbec1c18f56f789839d773c';
let stateData = null;
let variableData = null;

const fetchStates = (ev) => {
    //documentation: https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*
    if (ev) { highlightButton(ev); }
    
    if (stateData) {
        displayStates();
        return;
    }

    //only query if it doesn't exist yet:
    const url = 'https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*';
    document.querySelector('#output').innerHTML = 'loading...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            stateData = data;
            displayStates();
        });
};

const displayStates = () => {
    const showRawJSON = document.querySelector('#data-view').checked;
    if (showRawJSON) {
        document.querySelector('#output').innerHTML = `<pre>${JSON.stringify(stateData, null, 2)}</pre>`;
    } else {
        alert('table');
    }
};

const fetchVariables = (ev) => {
    // documentation: https://api.census.gov/data/2010/dec/sf1/variables.json
    //                https://api.census.gov/data/2010/dec/sf1/variables.html
    
    if (ev) { highlightButton(ev); }
    if (variableData) {
        displayVariables();
        return;
    }

    //only query if it doesn't exist yet:
    const url = 'https://api.census.gov/data/2010/dec/sf1/variables.json';
    document.querySelector('#output').innerHTML = 'loading...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            variableData = data;
            displayVariables();
        })
}

const displayVariables = (ev) => {
    const showRawJSON = document.querySelector('#data-view').checked;
    if (showRawJSON) {
        document.querySelector('#output').innerHTML = `<pre>${JSON.stringify(variableData, null, 2)}</pre>`;
    } else {
        const rows = [];
        for (const key in variableData.variables) {
            if (key.startsWith('PCT')) {
                const entry = variableData.variables[key];
                const label = entry.label.replaceAll('!!', ' > ');
                rows.push(`<td>${key}</td><td>${label}</td>`);
            }
        }
        document.querySelector('#output').innerHTML = '<table><tr>' + rows.join('</tr><tr>') + '</tr></table>';
    }
};

const highlightButton = (ev) => {
    for (const btn of document.querySelectorAll('button')) {
        btn.classList.remove('selected');
    }
    console.log(ev.srcElement);
    ev.srcElement.classList.add('selected');
};

const renderTemplate = (domID) => {
    const template = `<div style="">
        <button id="states" class="selected">State</button>
        <button id="variables">Variables</button>
        <a href="http://racialdotmap.demographics.coopercenter.org/" target="_blank">Dot Map</a>
        <input type="checkbox" id="data-view" checked />
        <div id="output"></div>
    </div>`
    document.querySelector('#' + domID).innerHTML = template;
    document.querySelector('#states').onclick = fetchStates;
    document.querySelector('#variables').onclick = fetchVariables;
    document.querySelector('#data-view').onclick = () => {
        document.querySelector('button.selected').click();
    };
};

renderTemplate('census_demo');
fetchStates();