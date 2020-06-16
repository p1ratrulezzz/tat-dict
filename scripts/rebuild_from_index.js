'use strict';

const fs = require('fs');
const sortObject = require('sort-object-keys');
const slugify = require('transliteration').slugify;
const pako = require('pako');
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
    let tatLetters = [
        'ә',
        'ө',
        'ң',
        'җ',
        'i',
        'ү',
        'һ',
        'h',
        'ё'
    ];

    let tatLettersReplacements = [
        'э',
        'о',
        'н',
        'ж',
        'и',
        'у',
        'х',
        'х',
        'е'
    ];

    for (let p in jsonContent) {
        if (!jsonContent.hasOwnProperty(p)) {
            continue;
        }

        let word = p;
        let definitions = jsonContent[word].join("\n");
        let firstLetter = slugify(word.substr(0, 1).toLocaleLowerCase()) || 'zzz_rest';
        let slug = word.toLocaleLowerCase();
        tatLetters.forEach((_letter, _index) => {
            slug = slug.replace(new RegExp(_letter, 'igm'), tatLettersReplacements[_index]);
        });

        jsonKeyed[firstLetter] = jsonKeyed[firstLetter] || {};
        jsonKeyed[firstLetter][ref] = {
            'id': firstLetter + ':' + ref,
            'word': word,
            'slug': slug,
            'definition': definitions,
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
        this.field('slug');
        this.field('definition');
        this.metadataWhitelist = ['position'];

        for (let letter in documents) {
            if (!documents.hasOwnProperty(letter)) {
                continue;
            }

            for (let p in documents[letter]) {
                if (!documents[letter].hasOwnProperty(p)) {
                    continue;
                }
                this.add(documents[letter][p]);
            }

            fs.writeFileSync(indexedPath + '/../index.gz/' + letter + '.min.json.gz', pako.deflate(JSON.stringify(documents[letter]), {to: 'string'}));
        }
    });

    let serializedIdx = JSON.stringify(lunrIndex);
    fs.writeFileSync(indexedPath + '/../index.lunr.min.json.gz', pako.deflate(serializedIdx, { to: 'string' }));
}

fs.readdir(indexedPath, rebuildIndexCb);