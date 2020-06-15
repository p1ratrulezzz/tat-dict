(function(jsonHelper) {
    window.addEventListener("load", function(event) {

        jsonHelper.loadJSON('/data/index.lunr.min.json', function(response) {
            let data = JSON.parse(response);
            let lunrIndex = lunr.Index.load(data);

            window.lunrIndex = lunrIndex;
            let results = lunrIndex.search('*камень*');
            console.log(results);
        });
    });
}) (jsonHelper);