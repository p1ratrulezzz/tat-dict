(function($) {
    let indexLoadedPromise;
    (function promiseTest() {
        if (window.Promise != null) {
            return initPromise();
        }
        
        setTimeout(promiseTest, 30);
    })();
    
    function initPromise() {
        return indexLoadedPromise = new Promise(function(resolve, reject) {
            (function pakoTest() {
                if (window.pako != null && pako.inflate != null && window.jsonHelper != null) {
                    return resolve();
                }

                setTimeout(pakoTest, 30);
            }) ();
        }).then(function() {
            return new Promise(function(resolve, reject) {
                jsonHelper.loadJSON('/data/index.lunr.min.json.gz', function(response) {
                    let data = JSON.parse(pako.inflate(response, { to: 'string' }));
                    resolve(data);
                });
            });
        });
    }
    
    window.addEventListener("load", function(event) {
        $ = window.jQuery;

        // The page is fully loaded.
        indexLoadedPromise.then(function(data) {
            let lunrIndex = lunr.Index.load(data);
            window.lunrIndex = lunrIndex;
            indexLoaded(lunrIndex);
        });
    });

    // Main entrypoint.
    function indexLoaded(lunrIndex) {
        let $searchButton = $('button.search-button');
        let $searchBox = $('input.search-box');
        let $spinnerSearchButton = $('.search-actions-wrapper .spinner');
        let $spinnerGlobal = $('.spinner-global');

        function enableSearch() {
            $searchButton.removeAttr('disabled');
            $searchBox.removeAttr('disabled');
            $spinnerSearchButton.addClass('d-none');
            $spinnerGlobal.addClass('d-none');
        }

        enableSearch();

        function disableSearch() {
            $searchButton.attr('disabled', 'disabled');
            $searchBox.attr('disabled', 'disabled');
            $spinnerSearchButton.removeClass('d-none');
        }

        let wordsData = {};
        function searchAndGetWord(querystring, paramsSearch) {
            let params = {
                wildcard_left: false,
                wildcard_right: false,
                fields: [],
            };
            
            for (let p in paramsSearch) {
                if (paramsSearch.hasOwnProperty(p)) {
                    params[p] = paramsSearch[p];
                }
            }
           
            let results = lunrIndex.query(function(q) {
                let wildcard = lunr.Query.wildcard.NONE;
                if (params.wildcard_left) {
                    wildcard |= lunr.Query.wildcard.LEADING;
                }

                if (params.wildcard_right) {
                    wildcard |= lunr.Query.wildcard.TRAILING;
                }

                let lunrOptions = {
                    wildcard: wildcard
                };
                if (params.fields.length > 0) {
                    lunrOptions.fields = params.fields;
                }

                querystring.toLocaleLowerCase().split(' ').forEach(function(word) {
                    q.term(word.trim(), lunrOptions);
                });
            });

            let resultsFound = [];
            let searchPromise = new Promise(function(resolve, reject) {
                resolve(resultsFound);
            });

            results.forEach(function(result) {
                let ref = result.ref.split(':');
                let letter = ref[0];
                let id = ref[1];
                searchPromise = searchPromise.then(function() {
                    if (wordsData[letter] == null) {
                        return new Promise(function(resolve, reject) {
                            let jsonFile = '/data/index.gz/' + letter + '.min.json.gz';
                            jsonHelper.loadJSON(jsonFile, function(response) {
                                let _data = JSON.parse(pako.inflate(response, {to: 'string'}));
                                wordsData[letter] = _data;
                                resultsFound.push([wordsData[letter][id], result.matchData.metadata]);
                                resolve(resultsFound);
                            });
                        });
                    }
                    else {
                        resultsFound.push([wordsData[letter][id], result.matchData.metadata]);
                        return resultsFound;
                    }
                });
            });

            return searchPromise;
        }

        window.searchAndGetWord = searchAndGetWord;

        function doSearch(e) {
            let queryString = $('input.search-box').val().trim();
            let onlyWordsSearch = $('#only-word-search').prop('checked');
            let wildcardSearch = $('#wildcard-search').prop('checked');

            new Promise(function(resolve) {
                disableSearch();
                location.hash = '#' + $searchBox.val() + '?only-word-search=' + String(onlyWordsSearch ? 1 : 0) + '&wildcard-search=' + String(wildcardSearch ? 1 : 0);

                setTimeout(function() {
                    // Small timeout to prevent browser stuck.
                    resolve();
                }, 30);
            }).then(function() {
                searchAndGetWord(queryString, {
                    'wildcard_left': wildcardSearch,
                    'wildcard_right': wildcardSearch,
                    'fields': onlyWordsSearch ? ['word', 'slug'] : [],
                }).then(function(resultsFound) {
                    let templateHtml = $('.templates-wrapper').html();
                    let $searchResultsWrapper = $('.search-results');
                    $searchResultsWrapper.html('');
                    if (resultsFound.length === 0) {
                        let $item = $(templateHtml);
                        $item.find('.word').html('Не найдено');
                        $item.find('.definition').html('По вашему запросу не найдено подходящих результатов');

                        $searchResultsWrapper.append($item);
                    }
                    else {
                        resultsFound.forEach(function(resultRaw) {
                            let result = JSON.parse(JSON.stringify(resultRaw[0]));
                            let $item = $(templateHtml);

                            for (let _matchText in resultRaw[1]) {
                                let match = resultRaw[1][_matchText];
                                for (let _matchProp in match) {
                                    let positions = match[_matchProp].position;
                                    positions.forEach(function (_pos) {
                                        let highlightedWord = result[_matchProp].substr(_pos[0], _pos[1] - 1);
                                        let $span = $('<span></span>');
                                        $span.addClass('bg-warning text-white');
                                        $span.html(highlightedWord);

                                        result[_matchProp] =
                                            result[_matchProp].substr(0, _pos[0]) + $span.get(0).outerHTML
                                            + result[_matchProp].substr(_pos[1] +_pos[0] - 1);
                                    });
                                }
                            }

                            $item.find('.word').html(result.word);
                            $item.find('.definition').html(result.definition);

                            $searchResultsWrapper.append($item);
                        });
                    }

                    enableSearch();
                });
            });
        }

        $searchButton.on('click', doSearch);
        $searchBox.on('keyup', function(e) {
            if (e.key === 'Enter') {
                doSearch();
            }
        });

        if (location.hash != null && location.hash.length > 1) {
            let querystring = location.hash.substr(1).replace(/([^\?])\?.+/igm, '$1');
            $searchBox.val(decodeURI(querystring));
            doSearch();
        }
    }
}) ();
