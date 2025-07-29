'use strict';
var rp = require('request-promise');
const request = require('superagent')
require('superagent-charset')(request)
// const url = 'http://hq.sinajs.cn/list=';
//https://www.php.cn/blog/detail/24976.html
const url = 'http://qt.gtimg.cn/r=0.8409869808238q=';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko)' +
        ' Chrome/74.0.3729.169 Safari/537.36',
}


const STOCK_API_URL = 'https://jay.tohours.com/miniprogram/api/external/stock/query-code';

export default {
    stockCache: {},
    isStockCacheInitialized: false, // 添加标志位

    async initializeStockCache() {
        if (!this.isStockCacheInitialized) {
            await this.fetchAllStockCodes();
            this.isStockCacheInitialized = true; // 设置标志位为已初始化
        }
    },

    async fetchAllStockCodes() {
        if (this.isStockCacheInitialized) {
            console.log("Stock cache already initialized, skipping fetch.");
            return;
        } // 如果已初始化，直接返回

        let pageNo = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            try {
                const response = await request
                    .get(STOCK_API_URL)
                    .query({ pageNo, pageSize });

                const data = response.body;
                // console.log("Fetched data for page", pageNo, ":", data);
                if (data && data.resData && data.resData.records && data.resData.records.length > 0) {
                    // console.log("Fetched stock codes:", data.resData.records);
                    data.resData.records.forEach(stock => {
                        // stock.name去掉两端和中间的空格
                        this.stockCache[stock.code] = stock.name.replace(/\s+/g, '');
                    });

                    hasMore = data.resData.records.length === pageSize;
                    pageNo++;
                } else {
                    hasMore = false;
                }
            } catch (error) {
                console.error('Error fetching stock codes:', error);
                hasMore = false;
            }
        }
        // console.log("Final stockCache:", this.stockCache);
    },

    searchStocks(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        // console.log(this.stockCache);
        for (const [code, name] of Object.entries(this.stockCache)) {
            if (code.toLowerCase().includes(lowerQuery) || name.toLowerCase().includes(lowerQuery)) {
                results.push({ code, name });
            }
        }

        return results;
    },

    searchStockByCodeOrName(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const [code, name] of Object.entries(this.stockCache)) {
            if (code.toLowerCase().startsWith(lowerQuery) || name.toLowerCase().startsWith(lowerQuery)) {
                results.push({ code, name });
            }
        }

        return results;
    },

    getData: function (code, callback) {
        // var codeArr = code.split(",");
        var that = this;
        // var textAll = "";
        var urlAll = url;
        
        // 确保code是一个数组
        if (!code || !Array.isArray(code) || code.length === 0) {
            console.log("No stock codes provided or invalid format");
            callback("没有股票数据");
            return;
        }
        
        code.forEach(function (stockCode) {
            if (!stockCode || typeof stockCode !== 'object' || !stockCode.code) {
                console.log("Invalid stock code item:", stockCode);
                return;
            }
            
            var codeValue = stockCode.code;
            console.log("codeValue: " + codeValue);
            // if (!code.startsWith("s_")) {
            //     code = "s_" + code;
            // }
            // 根据股票代码添加sz，sh前缀
            if (codeValue.startsWith("6")) {
                codeValue = "sh" + codeValue;
            } else if (codeValue.startsWith("0")) {
                codeValue = "sz" + codeValue;
            }
            urlAll = urlAll + codeValue + ",";
        })
        console.log("urlAll: " + urlAll);
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
                const resultsArray = results.split(";");
                var textAll = "";
                for (let i = 0; i < resultsArray.length - 1; i++) {

                    let result = resultsArray[i];
                    var arr = result.split("~")
                    console.log(arr)
                    var stockName = arr[1];
                    var stockCode = arr[2];
                    var currPrice = arr[3];
                    var percentage = arr[32];
                    var priceBuyer1 = arr[9];
                    var amountBuyer1 = arr[10];
                    var amountBuyer1Total = priceBuyer1 * amountBuyer1 * 100;                    var param = {}
                    var sizes = ['', 'W', 'Y'];
                    var m;
                    if(amountBuyer1Total < 10000){
                        // 保留2位小数
                        param.value = amountBuyer1Total.toFixed(2);
                        param.unit=''
                    }else{
                        m = Math.floor(Math.log(amountBuyer1Total) / Math.log(10000));
                        param.value = ((amountBuyer1Total / Math.pow(10000, m))).toFixed(4);
                        param.unit = sizes[m];
                    }
                    // console.log("amountBuyer1Total: " + param.value + param.unit);

                    // 将封单金额转换为万元
                    var sealAmountInWan = 0;
                    if (param.unit === 'Y') {
                        sealAmountInWan = parseFloat(param.value) * 10000;
                    } else if (param.unit === 'W') {
                        sealAmountInWan = parseFloat(param.value);
                    } else {
                        sealAmountInWan = parseFloat(param.value) / 10000;
                    }

                    var text = stockName + '  ' + currPrice + "/" + percentage + "%" + '  '+ param.value + param.unit + "\n";
                    textAll = textAll + text;
                    console.log(textAll);
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

// 在程序启动时调用 initializeStockCache
(async () => {
    const stockUtils = require('./stock').default;
    await stockUtils.initializeStockCache();
})();
