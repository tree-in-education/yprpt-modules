const API_KEY = '1983b495da8f0c848fbec1c18f56f789839d773c';
let stateData = null;
let variableData = null;
let groupData = null;
let stateTree = null;
let variableTree = null;
let groupLookup = null;

const fetchStates = (ev) => {
    //documentation: https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*
    if (ev) { highlightButton(ev); }
    
    if (stateData) {
        displayStates();
        return;
    }

    //only query if it doesn't exist yet:
    const url = 'https://api.census.gov/data/2010/dec/sf1?get=H001001,NAME&for=state:*';
    document.querySelector('#output').innerHTML = 'Retrieving data from census.gov...';
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
                housing_units: parseInt(state[0]),
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
            rows.push(`<td>${key}</td><td>${numberWithCommas(entry.housing_units)}</td><td>${entry.code}</td>`);
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
    document.querySelector('#output').innerHTML = 'Retrieving data from census.gov...';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            variableData = data;
            fetchGroups();
        })
}

const fetchUrl = (url, globalVar, callback) => {
    
}

const fetchGroups = (ev) => {
    if (groupData) {
        buildGroupLookup();
        return;
    }

    const url = 'https://api.census.gov/data/2010/dec/sf1/groups.json';
    document.querySelector('#output').innerHTML = 'Retrieving data from census.gov...';
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
        jsonify(variableTree);
    } else {
        // const rows = [];
        // for (const key in variableData.variables) {
        //     const entry = variableData.variables[key];
        //     const label = entry.label.replaceAll('!!', ' > ');
        //     rows.push(`<td>${key}</td><td style="width:300px;">${label}</td><TD>${entry.concept}`);
        // }
        // document.querySelector('#output').innerHTML = '<table><tr>' + rows.join('</tr><tr>') + '</tr></table>';
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
                    <td>${entry2.Metadata.code}</td>
                    <td>${description2}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                `);
                for (key2 in entry2) {
                    if (key2 === 'Metadata') {
                        continue;
                    }
                    const entry3 = entry2[key2];
                    const description3 = entry3.Metadata.description ? entry3.Metadata.description.toLowerCase() : '';
                    rows.push(`
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${key2}</td>
                        <td>${entry3.Metadata.code}</td>
                        <td>${description3}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    `);

                    for (key3 in entry3) {
                        if (key3 === 'Metadata') {
                            continue;
                        }
                        const entry4 = entry3[key3];
                        const description4 = entry4.Metadata.description ? entry4.Metadata.description.toLowerCase() : '';
                        rows.push(`
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>${key3}</td>
                            <td>${entry4.Metadata.code}</td>
                            <td>${description4}</td>
                        `);
                    }
                }
            }
        }
        document.querySelector('#output').innerHTML = '<table class="variables"><tr>' + rows.join('</tr><tr>') + '</tr></table>';
    }
};

const buildVariableTree = () => {
    variableTree = {};
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
                if (entry.concept) {
                    elem[token].Metadata.description = entry.concept;
                }
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
};

const jsonify = (data) => {
    document.querySelector('#output').innerHTML = '';
    var jsonViewer = new JSONViewer();
    document.querySelector('#output').appendChild(jsonViewer.getContainer());
    jsonViewer.showJSON(data, -1, 1);
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
    const template = `<div class="container">
        <section class="toolbar">
            <span class="buttons">
                <button id="variables" class="selected">Variable Codes</button>
                <button id="states">State Codes</button>
            </span>
            <span class="pull-right"><input type="checkbox" id="data-view" checked /> Code View</span>
        </section>
        <div id="output"></div>
    </div>`
    document.querySelector('#' + domID).innerHTML = template;
    document.querySelector('#states').onclick = fetchStates;
    document.querySelector('#variables').onclick = fetchVariables;
    document.querySelector('#data-view').onchange = () => {
        document.querySelector('#output').innerHTML = 'Updating display...';
        setTimeout(
            () => {
                document.querySelector('button.selected').click();
            }, 10);
    };
};

renderTemplate('census_demo');
fetchVariables();