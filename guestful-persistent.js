var request = require('request'),
    async = require('async');

module.exports = {

    load: function (config, callback) {

        var self = this,
            calls = {};

        for (var v in config) {
            calls[v] = (function (varname) {
                var fn = function (asyncCallback) {
                    if (asyncCallback) {
                        console.log('Loading "persistent.' + varname + '" from ' + config[varname].url);
                    } else {
                        console.log('Reloading "persistent.' + varname + '" from ' + config[varname].url);
                    }
                    request(config[varname].url, function (error, response, body) {
                        if (error || response.statusCode != 200) {
                            if (asyncCallback) {
                                asyncCallback(new Error("Could not load static file for '" + varname + "' from: " + config[varname].url + (error ? error : " (status code: " + response.statusCode + ")")));
                            }
                        } else {
                            self[varname] = JSON.parse(body);
                            if (config[varname].transform && typeof config[varname].transform == "function") {
                                self[varname] = config[varname].transform(self[varname]);
                            }
                            if (asyncCallback) {
                                asyncCallback();
                            }
                        }
                    });
                };
                if (config[varname].maxAge && config[varname].maxAge > 0) {
                    setInterval(function () {
                        fn();
                    }, config[varname].maxAge * 1000);
                }
                return fn;
            })(v);
        }

        async.parallel(calls, function (err) {
            callback(err);
        });

    }
};
