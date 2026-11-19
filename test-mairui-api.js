async function testMairuiAPI() {
    const license = (process.env.MAIRUI_API_LICENSE || '').trim();
    if (!license) {
        console.error('请设置 MAIRUI_API_LICENSE');
        process.exitCode = 1;
        return;
    }
    const request = require('superagent');
    console.log('测试迈瑞API...');
    
    try {
        const response = await request
            .get(`https://api.mairuiapi.com/hslt/list/${encodeURIComponent(license)}`)
            .timeout(30000)
            .buffer(true)
            .parse(request.parse.text); // 禁用自动JSON解析
        
        console.log('响应状态:', response.status);
        console.log('响应类型:', response.type);
        console.log('响应数据长度:', response.text ? response.text.length : 0);
        
        let stockData = null;
        
        if (response.text) {
            try {
                stockData = JSON.parse(response.text);
                console.log('JSON解析成功，数据条数:', stockData.length);
            } catch (parseError) {
                console.warn('JSON解析失败');
                
                // 尝试修复被截断的JSON
                let fixedText = response.text;
                if (!fixedText.endsWith(']')) {
                    const lastCompleteIndex = fixedText.lastIndexOf('}');
                    if (lastCompleteIndex > 0) {
                        fixedText = fixedText.substring(0, lastCompleteIndex + 1) + ']';
                        console.log('尝试修复JSON，修复后长度:', fixedText.length);
                        try {
                            stockData = JSON.parse(fixedText);
                            console.log('修复后JSON解析成功，数据条数:', stockData.length);
                        } catch (fixError) {
                            console.error('修复后仍无法解析');
                        }
                    }
                }
            }
        }
        
    } catch (_) {
        console.error('API请求失败');
        process.exitCode = 1;
    }
}

testMairuiAPI();
