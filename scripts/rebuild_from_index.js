'use strict';

const fs = require('fs');
const sortObject = require('sort-object-keys');

Object.prototype.sortAsc = function() {
    return Object.assign({}, sortObject(this));
};

let indexedPath = __dirname + '/../data/index';
function rebuildIndexCb(err, files) {
    if (err) {
        throw err;
    }

    let jsonContent = {};
    for (let i=0; i < files.length; i++) {
        let filename = files[i];
        let filepath = indexedPath + '/' + files[i];

        if (filename === '.' || filename === '..' || filename === '___broken.min.json') {
            continue;
        }

        let jsonData = JSON.parse(fs.readFileSync(filepath));
        jsonContent = Object.assign(jsonData, jsonContent);
    }

    let jsonKeyed = {};
    jsonContent = jsonContent.sortAsc();
    let ref = 1;
    for (let p in jsonContent) {
        if (!jsonContent.hasOwnProperty(p)) {
            continue;
        }

        let word = p;
        let definitions = jsonContent[word];
        jsonKeyed[word] = {
            'id': ref,
            'word': word,
            'definitions': definitions,
        };

        ref++;
    }

    dataRead(jsonKeyed);
}

function dataRead(data) {
    let a = 1;
    fs.writeFileSync(indexedPath + '/../build.json', JSON.stringify(data, null, 4));
}

fs.readdir(indexedPath, rebuildIndexCb);