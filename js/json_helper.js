(function () {
    let jsonHelper = function() {
        this.loadJSON = function (jsonFile, callback) {
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', jsonFile, true);
            // xobj.setRequestHeader('Content-Encoding','gzip');
            xobj.onerror = function (e) {
                alert("Error " + e.target.status + " occurred while receiving the document. Try to refresh the page");
            };

            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == 200) {

                    // .open will NOT return a value but simply returns undefined in async mode so use a callback
                    callback(xobj.responseText);
                }
            };

            xobj.send(null);
        };

        return this;
    };

    window.jsonHelper = new jsonHelper();
})();
