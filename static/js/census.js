const API_KEY = '1983b495da8f0c848fbec1c18f56f789839d773c';
let stateData = null;
let countyData = null;
let variableData = null;
let groupData = null;
let stateTree = null;
let variableTree = null;
let groupLookup = null;
let stateLookup = null;
let variableLookup = null;
let variables = ['NAME'];
let states = [];


/*
    Other example queries:
    Examples published here: https://api.census.gov/data/2010/dec/sf1/examples.html
    
    1. Get counties in the state of illinois:
        https://api.census.gov/data/2010/dec/sf1?get=NAME,H001001&for=county:*&in=state:17`; 
    2. Get tracts in the state of illinois:
        https://api.census.gov/data/2010/dec/sf1?get=TRACT,NAME&for=tract:*&in=state:17
    3. Get data by  zip code: 
        https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=zip%20code%20tabulation%20area:60202
    4. Block, Block Group, Tract, County in Lake, Cook counties:
        https://api.census.gov/data/2010/dec/sf1?get=P001001,NAME,ZCTA5&for=tract:*&in=state:17&in=county:031,097&in=tract:*
    5. Block Group, Tract, County in Lake, Cook counties:
*/

const fetchStates = (ev) => {
    //documentation: https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*
    if (ev) { highlightButton(ev); }
    
    if (stateData) {
        displayStates();
        return;
    }

    //only query if it doesn't exist yet:
    // population code: P001001
    const url = 'https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*';
    document.querySelector('#variable-selection').innerHTML = 'Retrieving data from census.gov...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            stateData = data;
            fetchCounties();
        });
};

fetchCounties = () => {
    const url = `https://api.census.gov/data/2010/dec/sf1?get=NAME,H001001&for=county:*&in=state:*`; 
    console.log('fetching:', url);
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            countyData = data;
            displayStates();
            // jsonify(data, target='#results', callback=null, depth=2);
        });
};

const displayStates = () => {
    const showRawJSON = document.querySelector('#data-view').checked;
    if (!stateTree) {
        stateTree = {};
        stateLookup = {};
        for (const state of stateData) {
            stateLookup[state[2]] = state[1];
            stateTree[state[1]] = {
                housing_units: parseInt(state[0]),
                code: state[2]
            }
        }
        delete stateTree['NAME'];
    }
    if (showRawJSON) {
        jsonify(stateTree, target="#variable-selection", callback=addState, depth=2);
    } else {
        const rows = []
        for (key in stateTree) {
            const entry = stateTree[key];
            rows.push(`
                <td>${key}</td>
                <td>${numberWithCommas(entry.housing_units)}</td>
                <td><a href="#" data-code="${entry.code}">${entry.code}</a></td>
            `);
        }
        document.querySelector('#variable-selection').innerHTML = '<table class="states"><tr>' + rows.join('</tr><tr>') + '</tr></table>';

        const links = document.querySelector('table.states').querySelectorAll('a');
        for (const link of links) {
            link.onclick = addState;
        }
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
    document.querySelector('#variable-selection').innerHTML = 'Retrieving data from census.gov...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            variableData = data;
            fetchGroups();
        })
}

const fetchGroups = (ev) => {
    if (groupData) {
        buildGroupLookup();
        return;
    }

    const url = 'https://api.census.gov/data/2010/dec/sf1/groups.json';
    document.querySelector('#variable-selection').innerHTML = 'Retrieving data from census.gov...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            groupData = data;
            displayVariables();
        });
}

const buildGroupLookup = () => {
    groupLookup = {};
    for (const entry of groupData.groups) {
        groupLookup[entry.name] = entry.description; 
    }
}

const displayVariables = (ev) => {
    const showRawJSON = document.querySelector('#data-view').checked;
    // build nested tree of categories and codes:
    if (!groupLookup) { buildGroupLookup(); }
    if (!variableTree) {  buildVariableTree(); }

    if (showRawJSON) {
        jsonify(variableTree, target="#variable-selection", callback=addVariable);
    } else {
        const rows = [];
        for (const group in variableTree) {
            const entry = variableTree[group];
            groupName = group ? group.toLowerCase() : '';
            rows.push(`
                    <th style="text-align:left;" colspan="9">${groupName}</th>
                `);
            for (key in entry) {
                const entry2 = entry[key];
                const description2 = entry2.Metadata.description ? entry2.Metadata.description.toLowerCase() : '';
                rows.push(`
                    <td>${key}</td>
                    <td><a href="#" data-code="${entry2.Metadata.code}">${entry2.Metadata.code}</a></td>
                    <td colspan="7">${description2}</td>
                `);
                for (key2 in entry2) {
                    if (key2 === 'Metadata') {
                        continue;
                    }
                    const entry3 = entry2[key2];
                    const description3 = entry3.Metadata.description ? entry3.Metadata.description.toLowerCase() : '';
                    rows.push(`
                        <td colspan="3"></td>
                        <td>${key2}</td>
                        <td><a href="#" data-code="${entry3.Metadata.code}">${entry3.Metadata.code}</a></td>
                        <td colspan="4">${description3}</td>
                    `);

                    for (key3 in entry3) {
                        if (key3 === 'Metadata') {
                            continue;
                        }
                        const entry4 = entry3[key3];
                        const description4 = entry4.Metadata.description ? entry4.Metadata.description.toLowerCase() : '';
                        rows.push(`
                            <td colspan="6"></td>
                            <td>${key3}</td>
                            <td><a href="#" data-code="${entry4.Metadata.code}">${entry4.Metadata.code}</a></td>
                            <td>${description4}</td>
                        `);
                    }
                }
            }
        }
        document.querySelector('#variable-selection').innerHTML = '<table class="variables"><tr>' + rows.join('</tr><tr>') + '</tr></table>';
        const links = document.querySelector('table.variables').querySelectorAll('a');
        for (const link of links) {
            link.onclick = addVariable;
        }
    }
};

const addVariable = (ev) => {
    variables.push(ev.currentTarget.dataset.code);
    const output = [];
    for (const code of variables) {
        if (variableLookup[code]) {
            output.push(code + ': ' + variableLookup[code].toLowerCase());
        }
        else {
            output.push(code);
        }
    }
    document.querySelector('#selected-variables').innerHTML = `
        <ul>
            <li>${output.join('</li><li>')}</li>
        </ul>`;
    getStatistics();
    return false;
};
const addState = (ev) => {
    states.push(ev.currentTarget.dataset.code);
    const output = [];
    for (const code of states) {
        if (stateLookup[code]) {
            output.push(code + ': ' + stateLookup[code].toLowerCase());
        }
        else {
            output.push(code);
        }
    }
    document.querySelector('#selected-states').innerHTML = `
        <ul>
            <li>${output.join('</li><li>')}</li>
        </ul>
        `
    getStatistics();
    return false;
};

const buildVariableTree = () => {
    variableTree = {};
    variableLookup = {};
    for (const key in variableData.variables) {
        const entry = variableData.variables[key];
        const group = groupLookup[entry.group] + ' (' + entry.group + ')';
        const tokens = entry.label.split('!!');
        const numTokens = tokens.length;
        if (!(group in variableTree)) {
            variableTree[group] = {};
        }
        let elem = variableTree[group];
        let level = 1;
        while (tokens.length > 0) {
            const token = tokens.shift();
            if (!(token in elem)) {
                elem[token] = {
                    Metadata: {}
                };
            }
            if (level === numTokens) {
                elem[token].Metadata.code = key;
                variableLookup[key] = entry.label.replaceAll('!!', ' > ');
                if (entry.concept) {
                    // variableLookup[key] = entry.concept;
                    elem[token].Metadata.description = entry.concept;
                } 
                // else {
                //     variableLookup[key] = 'Not available';
                // }
            }
            elem = elem[token];
            level += 1;
        }
    }
    function sortObject(o) {
        var sorted = {},
        key, a = [];
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                a.push(key);
            }
        }
        a.sort();
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = o[a[key]];
        }
        return sorted;
    }
    variableTree = sortObject(variableTree);
    variableLookup = sortObject(variableLookup);
    console.log(variableLookup);
};

const jsonify = (data, target='#variable-selection', callback=null, depth=1) => {
    document.querySelector(target).innerHTML = '';
    var jsonViewer = new JSONViewer();
    document.querySelector(target).appendChild(jsonViewer.getContainer());
    jsonViewer.showJSON(data, -1, depth);
    
    //add links:
    if (callback) {
        addLinks(callback);
    }
};

const addLinks = (callback) => {
    const nodes = document.querySelectorAll('.type-string');
    for (const node of nodes) {
        const text = node.parentElement.firstChild.data;
        if (text === 'code: ') {
            const code = node.innerHTML.slice(1, node.innerHTML.length-1);
            node.innerHTML = `<a href="#" data-code="${code}">${code}</a>`;
            node.querySelector('a').onclick = callback;
        }
    }
};

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
    const template = `<div class="container">
        <section class="toolbar">
            <span class="buttons">
                <button id="variables" class="selected">Variable Codes</button>
                <button id="states">State Codes</button>
            </span>
            <span class="pull-right"><input type="checkbox" id="data-view" checked /> Code View</span>
        </section>
        <section id="variable-selection"></section>
        <section id="queries">
            <div>
                <strong>Location</strong>
                <div id="selected-states"></div>
            </div>
            <div>
                <strong>Selected Variables</strong>
                <div id="selected-variables"></div>
            </div>
        </section>
        <section id="results"></section>
    </div>`
    document.querySelector('#' + domID).innerHTML = template;
    document.querySelector('#states').onclick = fetchStates;
    document.querySelector('#variables').onclick = fetchVariables;
    document.querySelector('#data-view').onchange = () => {
        document.querySelector('#variable-selection').innerHTML = 'Updating display...';
        setTimeout(
            () => {
                document.querySelector('button.selected').click();
            }, 10);
    };
};

const formatResults = (data) => {
    const results = {};
    const header = data.shift();
    header.shift();
    for (const row of data) {
        const state = row.shift();
        results[state] = {};
        for (let i = 0; i < row.length; i++) {
            const code = header[i];
            results[state][code] = { value: row[i] };
            if(variableLookup[code]) {
                results[state][code].description = variableLookup[code].toLowerCase();
            }
        }
    }
    return results;
}

const getStatistics = () => {
    if (states.length === 0 || variables.length === 0) {
        return;
    }
    // data for Cook County:
    // https://api.census.gov/data/2010/dec/sf1?get=NAME,PCT020003&for=county:031&in=state:17
    
    const url = `https://api.census.gov/data/2010/dec/sf1?get=${variables.join(',')}&for=state:${states.join(',')}`; 
    console.log('fetching:', url);
    fetch(url)
        .then(response => response.json())
        .then(data => {
            data = formatResults(data);
            jsonify(data, target='#results', callback=null, depth=3);
        })
}


//initialize:
renderTemplate('census_demo');
fetchVariables();
// getStatistics();
// fetchCounties();