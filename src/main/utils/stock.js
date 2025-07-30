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

    // 使用迈瑞API获取全A股股票数据
    async fetchAllStockCodesFromMairui() {
        console.log('开始从迈瑞API获取股票数据...');
        
        try {
            const response = await request
                .get('https://api.mairuiapi.com/hslt/list/LICENCE-66D8-9F96-0C7F0FBCD073')
                .timeout(30000)
                .buffer(true)
                .parse(request.parse.text); // 禁用自动JSON解析，作为文本处理
            
            let stockData = null;
            
            if (response.text) {
                try {
                    stockData = JSON.parse(response.text);
                    console.log(`从迈瑞API成功解析JSON，获取到 ${stockData.length} 条股票数据`);
                } catch (parseError) {
                    console.warn('JSON解析失败，尝试修复数据:', parseError.message);
                    console.log('原始响应长度:', response.text.length);
                    
                    // 尝试修复被截断的JSON
                    let fixedText = response.text;
                    
                    // 如果不以]结尾，说明被截断了
                    if (!fixedText.endsWith(']')) {
                        // 找到最后一个完整的对象
                        const lastCompleteIndex = fixedText.lastIndexOf('}');
                        if (lastCompleteIndex > 0) {
                            fixedText = fixedText.substring(0, lastCompleteIndex + 1) + ']';
                            console.log('尝试修复JSON...');
                            
                            try {
                                stockData = JSON.parse(fixedText);
                                console.log(`修复后成功解析JSON，获取到 ${stockData.length} 条股票数据`);
                            } catch (fixError) {
                                console.error('修复后仍无法解析:', fixError.message);
                                return 0;
                            }
                        } else {
                            console.error('无法找到完整的JSON对象');
                            return 0;
                        }
                    }
                }
            } else {
                console.error('迈瑞API没有返回文本数据');
                return 0;
            }
            
            if (stockData && Array.isArray(stockData)) {
                // 处理数据格式转换
                stockData.forEach(stock => {
                    if (stock.dm && stock.mc) {
                        // 提取纯代码（去掉交易所后缀）
                        const pureCode = stock.dm.split('.')[0];
                        
                        // 将数据存储到缓存中
                        this.stockCache[pureCode] = {
                            code: pureCode,
                            name: stock.mc.trim(),
                            fullCode: stock.dm, // 保留完整代码
                            exchange: stock.jys
                        };
                        
                        // 同时以名称为键存储，便于按名称搜索
                        this.stockCache[stock.mc.trim()] = {
                            code: pureCode,
                            name: stock.mc.trim(),
                            fullCode: stock.dm,
                            exchange: stock.jys
                        };
                    }
                });
                
                console.log(`迈瑞API数据处理完成，缓存中共有 ${Object.keys(this.stockCache).length} 条记录`);
                return stockData.length;
            } else {
                console.error('迈瑞API返回数据格式不正确');
                return 0;
            }
        } catch (error) {
            console.error('迈瑞API获取失败:', error);
            return 0;
        }
    },

    // 更新获取股票数据的主方法
    async fetchAllStockCodesFromEastMoney() {
        console.log('开始获取股票数据...');
        this.stockCache = {}; // 清空现有缓存
        
        try {
            // 方法1: 优先使用迈瑞API
            let count = await this.fetchAllStockCodesFromMairui();
            
            // 方法2: 如果迈瑞API失败或数据不够，尝试东方财富API
            if (count < 1000) {
                console.log('迈瑞API数据量不足，尝试东方财富API作为补充...');
                await this.tryEastmoneyApi();
            }
            
            // 方法3: 如果数据量还是不够，尝试新浪财经
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
            
            // 如果所有API都失败，至少保证有基础数据
            console.log('所有API都失败，使用基础股票数据');
            this.addBasicStockData();
            this.saveStockCacheToStorage();
            
            return Object.keys(this.stockCache).length;
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

    // 添加基础股票数据作为备用
    addBasicStockData() {
        console.log('添加基础股票数据...');
        
        const basicStocks = [
            { code: "000001", name: "平安银行" },
            { code: "000002", name: "万科A" },
            { code: "000858", name: "五粮液" },
            { code: "000876", name: "新希望" },
            { code: "002142", name: "宁波银行" },
            { code: "002415", name: "海康威视" },
            { code: "002475", name: "立讯精密" },
            { code: "300059", name: "东方财富" },
            { code: "300274", name: "阳光电源" },
            { code: "300750", name: "宁德时代" },
            { code: "600000", name: "浦发银行" },
            { code: "600036", name: "招商银行" },
            { code: "600519", name: "贵州茅台" },
            { code: "600900", name: "长江电力" },
            { code: "000858", name: "五粮液" },
            { code: "002304", name: "洋河股份" },
            { code: "600887", name: "伊利股份" },
            { code: "000063", name: "中兴通讯" },
            { code: "002230", name: "科大讯飞" },
            { code: "300015", name: "爱尔眼科" },
            { code: "300033", name: "同花顺" },
            { code: "600276", name: "恒瑞医药" },
            { code: "300142", name: "沃森生物" },
            { code: "002027", name: "分众传媒" },
            { code: "002008", name: "大族激光" },
            { code: "300144", name: "宋城演艺" },
            { code: "300347", name: "泰格医药" },
            { code: "688111", name: "金山办公" },
            { code: "688981", name: "中芯国际" },
            { code: "688099", name: "晶晨股份" }
        ];
        
        basicStocks.forEach(stock => {
            this.stockCache[stock.code] = {
                code: stock.code,
                name: stock.name,
                fullCode: stock.code,
                exchange: stock.code.startsWith('6') ? 'SH' : 'SZ'
            };
            
            // 同时以名称为键存储
            this.stockCache[stock.name] = {
                code: stock.code,
                name: stock.name,
                fullCode: stock.code,
                exchange: stock.code.startsWith('6') ? 'SH' : 'SZ'
            };
        });
        
        console.log(`添加了 ${basicStocks.length} 条基础股票数据`);
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

    // 搜索股票（按代码或名称）
    searchStocks(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const results = [];
        const lowerQuery = query.toLowerCase().trim();
        const resultSet = new Set(); // 用于去重

        // 确保股票缓存已初始化
        if (!this.isStockCacheInitialized) {
            console.warn('股票缓存尚未初始化');
            return [];
        }

        // 遍历股票缓存
        for (const [key, stockInfo] of Object.entries(this.stockCache)) {
            if (!stockInfo || typeof stockInfo !== 'object') {
                continue;
            }

            const { code, name } = stockInfo;
            if (!code || !name) {
                continue;
            }

            const lowerCode = code.toLowerCase();
            const lowerName = name.toLowerCase();

            // 精确匹配优先
            if (lowerCode === lowerQuery || lowerName === lowerQuery) {
                const resultKey = `${code}_${name}`;
                if (!resultSet.has(resultKey)) {
                    results.unshift({ code, name }); // 精确匹配放在前面
                    resultSet.add(resultKey);
                }
            }
            // 前缀匹配
            else if (lowerCode.startsWith(lowerQuery) || lowerName.startsWith(lowerQuery)) {
                const resultKey = `${code}_${name}`;
                if (!resultSet.has(resultKey)) {
                    results.push({ code, name });
                    resultSet.add(resultKey);
                }
            }
            // 包含匹配
            else if (lowerCode.includes(lowerQuery) || lowerName.includes(lowerQuery)) {
                const resultKey = `${code}_${name}`;
                if (!resultSet.has(resultKey) && results.length < 20) { // 限制包含匹配的数量
                    results.push({ code, name });
                    resultSet.add(resultKey);
                }
            }

            // 限制总结果数量
            if (results.length >= 50) {
                break;
            }
        }

        return results;
    },

    searchStockByCodeOrName(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const [key, stockInfo] of Object.entries(this.stockCache)) {
            if (typeof stockInfo === 'object' && stockInfo.code && stockInfo.name) {
                const { code, name } = stockInfo;
                if (code.toLowerCase().startsWith(lowerQuery) || name.toLowerCase().startsWith(lowerQuery)) {
                    results.push({ code, name });
                }
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
