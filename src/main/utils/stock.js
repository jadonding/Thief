'use strict';
var rp = require('request-promise');
const request = require('superagent')
require('superagent-charset')(request)
// const url = 'http://hq.sinajs.cn/list=';
const url = 'http://qt.gtimg.cn/r=0.8409869808238q=';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko)' +
        ' Chrome/74.0.3729.169 Safari/537.36',
}

export default {
    getData: function (code, callback) {

        var codeArr = code.split(",");
        var that = this;
        // var textAll = "";
        var urlAll = url;
        codeArr.forEach(function (code) {
            if (!code.startsWith("s_")) {
                code = "s_" + code;
            }
            urlAll = urlAll + code + ",";
        })
        // var responseArr = codeArr.map(code => {
        //
        //     return url + code
        // }).map(url => {
        //     return new Promise(function (resolve) {
        //         that.requestStock(url, function (res) {
        //             resolve(res);
        //         })
        //     })
        // })
        // Promise.all(responseArr)
        //     .then(function (res) {
        //         res.forEach(item => {
        //             textAll = textAll + item + " || ";
        //         })
        //         console.log(textAll)
        //         callback(textAll.substring(0, textAll.length-3));
        //     });
        that.requestStock(urlAll, function (res) {
            callback(res)
        })
    },
    requestStock(url, func) {
        console.log(url);
        request
            .get(url)
            .buffer(true)
            .charset("gbk")
            .then(function (res) {
                let results = res.text;
                console.log(results)
                const resultsArray = results.split(";");
                var textAll = "";
                for (let i = 0; i < resultsArray.length - 1; i++) {
                    let result = resultsArray[i];
                    var arr = result.split("~")
                    console.log(arr)
                    var stockName = arr[1];
                    var stockCode = arr[2];
                    var currPrice = arr[3];
                    var percentage = arr[5];
                    var text = stockName + '  ' + currPrice + "/" + percentage + "%" + "\r\n";
                    textAll = textAll + text;
                }
                func(textAll)
            }).catch((err) => {
            func(err);
        })
        // request
        //     .get(url)
        //     .buffer(true)
        //     .charset("gbk")
        //     .then(function (res) {
        //         const results = res.text;
        //         var arr = results.split(",")
        //         var firstLine = arr[0];
        //         var stockName = firstLine.split("\"")[1];
        //         var yesterday_price = parseFloat(arr[2]);
        //         var curr_price = parseFloat(arr[3]);
        //         var percentage = (curr_price - yesterday_price) / yesterday_price * 100
        //         if (curr_price < 10) {
        //             curr_price = curr_price.toFixed(3)
        //         } else {
        //             curr_price = curr_price.toFixed(2)
        //         }
        //         var text = stockName + '  ' + curr_price + "/" + percentage.toFixed(2) + "%" + "\r\n";
        //
        //         func(text);
        //     })
        //     .catch((err) => {
        //         func(err);
        //     })
    }
};