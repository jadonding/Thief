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

// 东方财富API地址
const EASTMONEY_API_URL = 'http://80.push2.eastmoney.com/api/qt/clist/get';

const stockUtils = {
    stockCache: {},
    isStockCacheInitialized: false, // 添加标志位

    // 从本地存储加载股票缓存
    loadStockCacheFromStorage() {
        try {
            const db = require('./db').default;
            const storedCache = db.get('stock_code_mapping');
            if (storedCache && Object.keys(storedCache).length > 0) {
                this.stockCache = storedCache;
                this.isStockCacheInitialized = true;
                console.log(`从本地存储加载了 ${Object.keys(this.stockCache).length} 条股票数据`);
                return true;
            }
        } catch (error) {
            console.error('从本地存储加载股票缓存失败:', error);
        }
        return false;
    },

    // 保存股票缓存到本地存储
    saveStockCacheToStorage() {
        try {
            const db = require('./db').default;
            db.set('stock_code_mapping', this.stockCache);
            db.set('stock_cache_update_time', new Date().toISOString());
            console.log(`保存了 ${Object.keys(this.stockCache).length} 条股票数据到本地存储`);
            return true;
        } catch (error) {
            console.error('保存股票缓存到本地存储失败:', error);
            return false;
        }
    },

    async initializeStockCache() {
        if (!this.isStockCacheInitialized) {
            // 首先尝试从本地加载
            if (!this.loadStockCacheFromStorage()) {
                // 如果本地没有数据，则从API获取
                console.log('本地无股票数据缓存，从API获取...');
                await this.fetchAllStockCodesFromEastMoney();
            }
            this.isStockCacheInitialized = true;
        }
    },

    // 使用东方财富API获取全A股股票数据
    async fetchAllStockCodesFromEastMoney() {
        console.log('开始从东方财富API获取股票数据...');
        this.stockCache = {}; // 清空现有缓存
        
        try {
            // 方法1: 尝试使用东方财富的数据接口
            await this.tryEastmoneyApi();
            
            // 方法2: 如果数据量不够，尝试新浪财经
            if (Object.keys(this.stockCache).length < 1000) {
                console.log('尝试使用新浪财经API获取股票数据...');
                await this.trySinaApi();
            }

            console.log(`总共获取到 ${Object.keys(this.stockCache).length} 条股票数据`);
            
            // 保存到本地存储
            this.saveStockCacheToStorage();
            
            return Object.keys(this.stockCache).length;
        } catch (error) {
            console.error('获取股票数据失败:', error);
        }
    },

    // 尝试东方财富API
    async tryEastmoneyApi() {
        try {
            console.log('尝试东方财富API...');
            const response = await request
                .get('http://80.push2.eastmoney.com/api/qt/clist/get')
                .query({
                    pn: 1,
                    pz: 5000,
                    po: 1,
                    np: 1,
                    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
                    fltt: 2,
                    invt: 2,
                    fid: 'f3',
                    fs: 'm:0 t:6,m:0 t:80,m:1 t:2,m:1 t:23',
                    fields: 'f12,f14'
                })
                .timeout(10000);

            if (response && response.body && response.body.data && response.body.data.diff) {
                const stocks = response.body.data.diff;
                stocks.forEach(stock => {
                    if (stock && stock.f12 && stock.f14) {
                        const code = String(stock.f12);
                        const name = String(stock.f14).trim();
                        if (code && name) {
                            this.stockCache[code] = name;
                        }
                    }
                });
                console.log(`东方财富API获取到 ${stocks.length} 条股票数据`);
            }
        } catch (error) {
            console.log('东方财富API失败:', error.message);
        }
    },

    // 尝试新浪财经API
    async trySinaApi() {
        try {
            console.log('尝试新浪财经API...');
            const response = await request
                .get('http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData')
                .query({
                    page: 1,
                    num: 5000,
                    sort: 'symbol',
                    asc: 1,
                    node: 'hs_a',
                    symbol: '',
                    _s_r_a: 'init'
                })
                .timeout(15000);

            if (response && response.body) {
                const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
                
                if (Array.isArray(data)) {
                    data.forEach(stock => {
                        if (stock && stock.symbol && stock.name) {
                            const code = stock.symbol.replace(/^(sh|sz)/, '');
                            const name = stock.name.trim();
                            if (code && name && !this.stockCache[code]) { // 避免覆盖已有数据
                                this.stockCache[code] = name;
                            }
                        }
                    });
                    console.log(`新浪财经API获取到 ${data.length} 条股票数据`);
                }
            }
        } catch (error) {
            console.log('新浪财经API失败:', error.message);
        }
    },

  

    // 手动刷新股票数据（供设置页面调用）
    async refreshStockData() {
        this.isStockCacheInitialized = false;
        const count = await this.fetchAllStockCodesFromEastMoney();
        this.isStockCacheInitialized = true;
        return count;
    },

    // 获取股票缓存统计信息
    getStockCacheInfo() {
        const db = require('./db').default;
        const updateTime = db.get('stock_cache_update_time');
        return {
            count: Object.keys(this.stockCache).length,
            updateTime: updateTime || '未知',
            isInitialized: this.isStockCacheInitialized
        };
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
            // console.log("codeValue: " + codeValue);
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
        // console.log("urlAll: " + urlAll);
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
        // console.log(url);
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
                    // console.log(arr)
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
                    // console.log(textAll);
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

// 导出模块
export default stockUtils;
