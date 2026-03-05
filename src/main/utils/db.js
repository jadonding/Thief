'use strict';
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import LodashId from 'lodash-id'
import { remote, app } from 'electron'

export default {
    data() {
        return {
            db_util: null,
            file_json: "",
            initialized: false,
            filePath: "",
            backupFilePath: "",
            defaultConfig: {},
            STORE_PATH: ""
        };
    },
    init() {
        if (this.initialized) {
            return true;
        }

        try {
            let APP = process.type === 'renderer' ? remote.app : app
            this.STORE_PATH = APP.getPath('userData')

            if (process.type !== 'renderer') {
                if (!fs.pathExistsSync(this.STORE_PATH)) {
                    fs.mkdirpSync(this.STORE_PATH)
                }
            }

            this.filePath = path.join(this.STORE_PATH, '/thief_data.json');
            this.backupFilePath = path.join(this.STORE_PATH, '/thief_data_backup.json');

            // 检查文件是否存在且可读
            if (!this.checkAndRecoverConfigFile()) {
                console.error('Config file check failed and recovery failed');
                return false;
            }

            this.file_json = new FileSync(this.filePath);
            this.db_util = low(this.file_json);
            this.db_util._.mixin(LodashId);
            
            // 初始化配置默认值
            this.initDefaultValues();
            
            // 标记已初始化
            this.initialized = true;
            return true;
        } catch (err) {
            console.error('Database initialization error:', err);
            return false;
        }
    },
    
    // 检查配置文件是否正常，如果损坏则尝试恢复
    checkAndRecoverConfigFile() {
        try {
            // 检查主配置文件
            if (fs.existsSync(this.filePath)) {
                try {
                    // 尝试读取主配置文件
                    JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                    
                    // 读取成功，创建备份
                    fs.copyFileSync(this.filePath, this.backupFilePath);
                    return true;
                } catch (parseErr) {
                    console.warn('Main config file corrupted, trying to recover from backup');
                    
                    // 主配置文件损坏，尝试从备份恢复
                    if (fs.existsSync(this.backupFilePath)) {
                        try {
                            const backupContent = fs.readFileSync(this.backupFilePath, 'utf8');
                            JSON.parse(backupContent); // 验证备份文件格式
                            fs.writeFileSync(this.filePath, backupContent);
                            return true;
                        } catch (backupErr) {
                            console.error('Backup file also corrupted');
                        }
                    }
                    
                    // 创建新的空配置文件
                    fs.writeFileSync(this.filePath, '{}');
                    return true;
                }
            } else {
                // 主配置文件不存在
                if (fs.existsSync(this.backupFilePath)) {
                    // 如果有备份则从备份恢复
                    try {
                        const backupContent = fs.readFileSync(this.backupFilePath, 'utf8');
                        JSON.parse(backupContent); // 验证备份文件格式
                        fs.writeFileSync(this.filePath, backupContent);
                        return true;
                    } catch (err) {
                        // 备份文件也损坏，创建新的空配置文件
                        fs.writeFileSync(this.filePath, '{}');
                        return true;
                    }
                } else {
                    // 没有备份，创建新的空配置文件
                    fs.writeFileSync(this.filePath, '{}');
                    return true;
                }
            }
        } catch (err) {
            console.error('Failed to check/recover config file:', err);
            return false;
        }
    },
    
    // 初始化默认值
    initDefaultValues() {
        // 保存默认配置，以便需要时重置
        this.defaultConfig = {
            current_page: 1,
            page_size: 20,
            is_english: false,
            line_break: " ",
            current_file_path: "",
            bg_color: "rgba(0, 0, 0, 0.5)",
            txt_color: "#fff",
            font_size: "14",
            second: "5",
            auto_page: "0",
            key_next: "Alt+2",
            key_previous: "Alt+1",
            key_boss: "Alt+3",
            key_auto: "Alt+P",
            errCodeChecked: false,
            is_mouse: "0",
            is_display_page: true,
            display_model: '1',
            display_shares_list: [],
            moyu_text: "Hello",
            desktop_wh: "",
            desktop_wz: "",
            is_ad: 0,
            limit_up_alert_enabled: true,
            dingtalk_webhook: "https://oapi.dingtalk.com/robot/send?access_token=075525de2be812c31c727e4ac783ed2969cf9c8e05974aa2db0d630ac88e95e2",
            at_phone_numbers: ["17195252748"],
            curr_model: ('darwin' === process.platform) ? "1" : "2",
            // 股票数据缓存相关
            stock_code_mapping: {},
            stock_cache_update_time: null
        };
        
        // 设置默认值
        Object.entries(this.defaultConfig).forEach(([key, value]) => {
            if (!this.db_util.has(key).value()) {
                this.db_util.set(key, value).write()
            }
        });

        if (!this.db_util.has('current_page').value()) {
            this.db_util.set('current_page', 1).write()
        }

        if (!this.db_util.has('page_size').value()) {
            this.db_util.set('page_size', 20).write()
        }

        if (!this.db_util.has('is_english').value()) {
            this.db_util.set('is_english', false).write()
        }

        if (!this.db_util.has('line_break').value()) {
            this.db_util.set('line_break', " ").write()
        }

        if (!this.db_util.has('current_file_path').value()) {
            this.db_util.set('current_file_path', "").write()
        }

        if (!this.db_util.has('bg_color').value()) {
            this.db_util.set('bg_color', "rgba(0, 0, 0, 0.5)").write()
        }

        if (!this.db_util.has('txt_color').value()) {
            this.db_util.set('txt_color', "#fff").write()
        }

        if (!this.db_util.has('font_size').value()) {
            this.db_util.set('font_size', "14").write()
        }

        if (!this.db_util.has('second').value()) {
            this.db_util.set('second', "5").write()
        }

        if (!this.db_util.has('auto_page').value()) {
            this.db_util.set('auto_page', "0").write()
        }

        if (!this.db_util.has('key_next').value()) {
            this.db_util.set('key_next', "Alt+2").write()
        }

        if (!this.db_util.has('key_previous').value()) {
            this.db_util.set('key_previous', "Alt+1").write()
        }

        if (!this.db_util.has('key_boss').value()) {
            this.db_util.set('key_boss', "Alt+3").write()
        }

        if (!this.db_util.has('key_auto').value()) {
            this.db_util.set('key_auto', "Alt+P").write()
        }

        if (!this.db_util.has('errCodeChecked').value()) {
            this.db_util.set('errCodeChecked', false).write()
        }

        if (!this.db_util.has('is_mouse').value()) {
            this.db_util.set('is_mouse', "0").write()
        }

        if (!this.db_util.has('is_display_page').value()) {
            this.db_util.set('is_display_page', true).write()
        }

        // if (!this.db_util.has('is_display_joke').value()) {
        //     this.db_util.set('is_display_joke', false).write()
        // }

        if (!this.db_util.has('display_model').value()) {
            this.db_util.set('display_model', '1').write()
        }

        if (!this.db_util.has('display_shares_list').value()) {
            this.db_util.set('display_shares_list', []).write()
        }

        if (!this.db_util.has('moyu_text').value()) {
            this.db_util.set('moyu_text', "Hello").write()
        }

        if (!this.db_util.has('desktop_wh').value()) {
            this.db_util.set('desktop_wh', "").write()
        }

        if (!this.db_util.has('desktop_wz').value()) {
            this.db_util.set('desktop_wz', "").write()
        }        if (!this.db_util.has('is_ad').value()) {
            this.db_util.set('is_ad', 0).write()
        }

        // 涨停告警配置
        if (!this.db_util.has('limit_up_alert_enabled').value()) {
            this.db_util.set('limit_up_alert_enabled', false).write()
        }

        if (!this.db_util.has('dingtalk_webhook').value()) {
            this.db_util.set('dingtalk_webhook', "").write()
        }

        if (!this.db_util.has('at_phone_numbers').value()) {
            this.db_util.set('at_phone_numbers', []).write()
        }

        let isMac = 'darwin' === process.platform;
        if (!this.db_util.has('curr_model').value()) {
            if (isMac) {
                this.db_util.set('curr_model', "1").write()
            } else {
                this.db_util.set('curr_model', "2").write()
            }
        }
    },
    
    // 创建配置备份
    createBackup() {
        try {
            if (fs.existsSync(this.filePath)) {
                fs.copyFileSync(this.filePath, this.backupFilePath);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to create config backup:', err);
            return false;
        }
    },
    
    // 获取配置值
    get(key) {
        try {
            if (!this.initialized && !this.init()) {
                console.warn(`Failed to initialize database when getting '${key}'`);
                return this.defaultConfig[key]; // 返回默认值
            }
            
            // 如果键存在返回键值，否则返回默认值
            const value = this.db_util.has(key).value() 
                ? this.db_util.get(key).value()
                : this.defaultConfig[key];
                
            return value;
        } catch (err) {
            console.error(`Error getting config '${key}':`, err);
            // 出错时返回默认值
            return this.defaultConfig[key];
        }
    },
    
    // 设置配置值
    set(key, value) {
        try {
            if (!this.initialized && !this.init()) {
                console.error(`Failed to initialize database when setting '${key}'`);
                return false;
            }
            
            console.log(`设置配置项 '${key}':`, value);
            
            // 写入配置并立即刷新到磁盘
            this.db_util.set(key, value).write();
            
            // 立即创建备份
            this.createBackup();
            
            // 验证写入是否成功
            const writtenValue = this.db_util.get(key).value();
            const success = JSON.stringify(writtenValue) === JSON.stringify(value);
            
            if (success) {
                console.log(`配置项 '${key}' 写入成功`);
            } else {
                console.error(`配置项 '${key}' 写入验证失败`);
                console.error('期望值:', value);
                console.error('实际值:', writtenValue);
            }
            
            return success;
        } catch (err) {
            console.error(`Error setting config '${key}':`, err);
            
            // 发生错误时尝试重新初始化数据库并重试一次
            try {
                this.initialized = false;
                if (this.init()) {
                    this.db_util.set(key, value).write();
                    this.createBackup();
                    
                    // 再次验证
                    const writtenValue = this.db_util.get(key).value();
                    const success = JSON.stringify(writtenValue) === JSON.stringify(value);
                    
                    if (success) {
                        console.log(`配置项 '${key}' 重试写入成功`);
                    } else {
                        console.error(`配置项 '${key}' 重试写入验证失败`);
                    }
                    
                    return success;
                }
            } catch (retryErr) {
                console.error(`Retry failed for setting '${key}':`, retryErr);
            }
            
            return false;
        }
    },
    
    // 批量设置配置值（原子性操作）
    setBatch(configMap) {
        try {
            if (!this.initialized && !this.init()) {
                console.error('Failed to initialize database when setting batch config');
                return false;
            }
            
            console.log('批量设置配置项:', Object.keys(configMap));
            console.log('display_shares_list 输入值:', JSON.stringify(configMap.display_shares_list));
            
            // 批量写入所有配置
            Object.entries(configMap).forEach(([key, value]) => {
                console.log(`设置配置项 '${key}':`, typeof value === 'object' ? JSON.stringify(value) : value);
                this.db_util.set(key, value);
            });
            
            // 统一写入到磁盘
            this.db_util.write();
            
            // 立即创建备份
            this.createBackup();
            
            // 验证所有写入是否成功
            let allSuccess = true;
            Object.entries(configMap).forEach(([key, value]) => {
                const writtenValue = this.db_util.get(key).value();
                const success = JSON.stringify(writtenValue) === JSON.stringify(value);
                
                if (success) {
                    console.log(`批量配置项 '${key}' 写入成功`);
                } else {
                    console.error(`批量配置项 '${key}' 写入验证失败`);
                    console.error('期望值:', JSON.stringify(value));
                    console.error('实际值:', JSON.stringify(writtenValue));
                    allSuccess = false;
                }
            });
            
            return allSuccess;
        } catch (err) {
            console.error('Error setting batch config:', err);
            return false;
        }
    },
    
    // 重置配置到默认值
    resetToDefault() {
        try {
            if (!this.initialized && !this.init()) {
                return false;
            }
            
            Object.entries(this.defaultConfig).forEach(([key, value]) => {
                this.db_util.set(key, value).write();
            });
            
            return true;
        } catch (err) {
            console.error('Failed to reset config to defaults:', err);
            return false;
        }
    },
    
    // 重置单个配置项到默认值
    resetKeyToDefault(key) {
        if (key in this.defaultConfig) {
            return this.set(key, this.defaultConfig[key]);
        }
        return false;
    },

    // 导出配置到文件
    exportConfig(targetPath) {
        try {
            if (!this.initialized && !this.init()) {
                return { success: false, message: '数据库初始化失败' };
            }
            
            // 获取当前配置
            const config = this.db_util.getState();
            
            // 写入到指定文件
            fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
            return { success: true, message: '配置导出成功' };
        } catch (err) {
            console.error('Failed to export config:', err);
            return { success: false, message: `导出失败: ${err.message}` };
        }
    },
    
    // 从文件导入配置
    importConfig(sourcePath) {
        try {
            if (!this.initialized && !this.init()) {
                return { success: false, message: '数据库初始化失败' };
            }
            
            // 读取配置文件
            const configContent = fs.readFileSync(sourcePath, 'utf8');
            const config = JSON.parse(configContent);
            
            // 先创建当前配置的备份
            this.createBackup();
            
            // 将导入的配置应用到数据库
            Object.entries(config).forEach(([key, value]) => {
                this.db_util.set(key, value).write();
            });
            
            return { success: true, message: '配置导入成功' };
        } catch (err) {
            console.error('Failed to import config:', err);
            return { success: false, message: `导入失败: ${err.message}` };
        }
    },

    // 强制重新加载配置文件
    reloadConfig() {
        try {
            console.log('强制重新加载配置文件');
            
            // 重置初始化标志
            this.initialized = false;
            
            // 重新初始化
            if (!this.init()) {
                console.error('重新加载配置失败');
                return false;
            }
            
            console.log('配置文件重新加载成功');
            return true;
        } catch (err) {
            console.error('重新加载配置失败:', err);
            return false;
        }
    },
};