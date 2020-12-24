const API_KEY = '1983b495da8f0c848fbec1c18f56f789839d773c';
let stateData = null;
let variableData = null;
let stateTree = null;
let variableTree = null;

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
    if (!stateTree) {
        stateTree = {};
        for (const state of stateData) {
            stateTree[state[1]] = {
                population: parseInt(state[0]),
                code: state[2]
            }
        }
        delete stateTree['NAME'];
    }
    if (showRawJSON) {
        jsonify(stateTree);
    } else {
        const rows = []
        for (key in stateTree) {
            const entry = stateTree[key];
            rows.push(`<td>${key}</td><td>${numberWithCommas(entry.population)}</td><td>${entry.code}</td>`);
        }
        document.querySelector('#output').innerHTML = '<table><tr>' + rows.join('</tr><tr>') + '</tr></table>';
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
        // build nested tree of categories and codes:
        if (!variableTree) { 
            buildVariableTree();
        }
        jsonify(variableTree);
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

const buildVariableTree = () => {
    variableTree = {};
    for (const key in variableData.variables) {
        const entry = variableData.variables[key];
        const tokens = entry.label.split('!!');
        const numTokens = tokens.length;
        let elem = variableTree;
        let level = 1;
        while (tokens.length > 0) {
            const token = tokens.shift();
            if (!elem.subcategories && level != 1) {
                elem.subcategories = {};
                elem = elem.subcategories;
            }
            if (!(token in elem)) {
                elem[token] = {};
            }
            if (level === numTokens) {
                elem[token].code = key;
                if (entry.concept) {
                    elem[token].concept = entry.concept;
                }
            }
            elem = elem[token];
            level += 1;
        }
    }
};

const jsonify = (data) => {
    document.querySelector('#output').innerHTML = '';
    var jsonViewer = new JSONViewer();
    document.querySelector('#output').appendChild(jsonViewer.getContainer());
    jsonViewer.showJSON(data, -1, 2);
}

const highlightButton = (ev) => {
    for (const btn of document.querySelectorAll('button')) {
        btn.classList.remove('selected');
    }
    console.log(ev.srcElement);
    ev.srcElement.classList.add('selected');
};

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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