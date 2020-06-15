'use strict';

const fs = require('fs');
const Entities = require('html-entities').AllHtmlEntities;
const slugify = require('transliteration').slugify;
const sortObject = require('sort-object-keys');

let jsPath = __dirname + '/../../old-js-tatdict/js';
let dict = {};
let dictIndexed = {};

Object.prototype.sortAsc = function() {
    return Object.assign({}, sortObject(this));
};

Object.prototype.isEmpty = function() {
  return Object.keys(this).length === 0;
};

String.prototype.decode=function() {
    var i = 0;
    var g = "";
    var code;
    var o;
    var s = this;
    for (i = 0; i < s.length; i++) {
        code = s.charCodeAt(i);
        if (code >= 1072 && code <= 1103)
            g += String.fromCharCode(code - 848);
        else {
            switch (code) {
                case 1025:
                    g += String.fromCharCode(code - 857);
                    break;
                case 1105:
                    g += String.fromCharCode(code - 921);
                    break;
                default:
                    g += s[i];

            }
        }
    }

    return g;
};

function readOldDict() {
    (function () {
        let base = {};
        let content = '';
        let splitter = '$%$';
        let test_string;

        content = fs.readFileSync(jsPath + '/tat.js');
        let contentTat = '(function() {' + content + ' return base["tat"]; }())';
        content = fs.readFileSync(jsPath + '/rus.js');
        let contentRus = '(function() {' + content + ' return base["rus"]; }())';
        base['tat'] = eval(contentTat);
        base['rus'] = eval(contentRus);
        content = null;

        base['rus'] = String(base['rus']).split(splitter);
        base['tat'] = String(base['tat']).split(splitter);

        let words = base['tat'];
        let definitions = base['rus'];
        base = null;

        let processWord = function(wordEncoded, definition) {
            let word = Entities.decode(wordEncoded);
            if (word.length === 0) {
                return;

            }

            let words = word.split(',');
            // Case 1: We have few words splitted by commas.
            if (words.length > 1) {
                words.forEach((_word) => {
                    processWord(_word.trim(), definition);
                });

                return;
            }

            let firstLetter = slugify(word.substr(0, 1).toLocaleLowerCase()) || 'zzz_rest';
            if (word.indexOf(' ') !== -1) {
                // Case 2. We have the same word with different definitions noted as "word I" or "word II"
                let re = / +I+[\. ]*$/gmi;
                let re2 = / +1+[\. ]*$/gmi;
                if (re.test(word)) {
                    word = word.replace(re, '');
                }
                // Case 3. We have a word with suffix "1."
                else if (re2.test(word)) {
                    word = word.replace(re, '');
                    definition = '1. ' + definition;
                }
                else {
                    firstLetter = '___broken';
                }
            }

            if (dict[firstLetter] == null) {
                let wordClean = word.toLocaleLowerCase().replace(/[\s]+/i, '');
                if (wordClean.substr(0, 1) === wordClean.substr(1, 1)) {
                    word = wordClean.trim().substr(1);
                }

                dict[firstLetter] = dict[firstLetter] || {};
            }

            dict[firstLetter][word] = dict[firstLetter][word] || [];
            dict[firstLetter][word].push(definition);
        };

        words.forEach((wordEncoded, index) => {
            let definition = Entities.decode(definitions[index]);
            processWord(wordEncoded, definition);
        });

        words = definitions = null;
    })();
}

function convertFromOldDict() {
    if (dict.isEmpty()) {
        readOldDict();
    }

    // Sort.
    dict = dict.sortAsc();
    for (let letter in dict) {
        if (!dict.hasOwnProperty(letter)) {
            continue;
        }

        dict[letter] = dict[letter].sortAsc();
        fs.writeFileSync(__dirname + '/../data/index/' + letter + '.min.json', JSON.stringify(dict[letter], null, 4));
    }

    fs.writeFileSync(__dirname + '/../data/dict.json', JSON.stringify(dict, null, 4));
    console.log('Conversion is done.');
}

convertFromOldDict();