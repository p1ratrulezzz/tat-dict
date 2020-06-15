'use strict';

const fs = require('fs');
const sortObject = require('sort-object-keys');
const lunr = require('lunr');
require('lunr-languages/lunr.stemmer.support.js')(lunr);
require('lunr-languages/lunr.ru.js')(lunr); // or any other language you want

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

function dataRead(documents) {
    let lunrIndex = lunr(function () {
        let self = this;
        this.use(lunr.ru);
        this.ref('id');
        this.field('word');
        this.field('definitions');

        for (let p in documents) {
            if (!documents.hasOwnProperty(p)) {
                continue;
            }

            this.add(documents[p]);
        }
    });

    let serializedIdx = JSON.stringify(lunrIndex);
    fs.writeFileSync(indexedPath + '/../index.json', JSON.stringify(documents, null, 4));
    fs.writeFileSync(indexedPath + '/../index.lunr.min.json', serializedIdx);
}

fs.readdir(indexedPath, rebuildIndexCb);