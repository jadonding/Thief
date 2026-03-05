'use strict';

import path from 'path'
import fs from 'fs-extra'
import { app } from 'electron'

const defaultConfig = {
  current_page: 1,
  page_size: 20,
  is_english: false,
  line_break: ' ',
  current_file_path: '',
  bg_color: 'rgba(0, 0, 0, 0.5)',
  txt_color: '#fff',
  font_size: '14',
  second: '5',
  auto_page: '0',
  key_next: 'Alt+2',
  key_previous: 'Alt+1',
  key_boss: 'Alt+3',
  key_auto: 'Alt+P',
  errCodeChecked: false,
  is_mouse: '0',
  is_display_page: true,
  display_model: '1',
  display_shares_list: [],
  moyu_text: 'Hello',
  desktop_wh: '',
  desktop_wz: '',
  is_ad: 0,
  limit_up_alert_enabled: true,
  dingtalk_webhook: 'https://oapi.dingtalk.com/robot/send?access_token=075525de2be812c31c727e4ac783ed2969cf9c8e05974aa2db0d630ac88e95e2',
  at_phone_numbers: ['17195252748'],
  curr_model: process.platform === 'darwin' ? '1' : '2',
  stock_code_mapping: {},
  stock_cache_update_time: null
}

function getElectronApp() {
  if (process.type === 'renderer') {
    const remote = require('@electron/remote')
    return remote.app
  }
  return app
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (_) {
    return null
  }
}

export default {
  initialized: false,
  STORE_PATH: '',
  filePath: '',
  backupFilePath: '',
  data: {},
  defaultConfig,

  init() {
    if (this.initialized) return true

    try {
      const APP = getElectronApp()
      this.STORE_PATH = APP.getPath('userData')
      fs.ensureDirSync(this.STORE_PATH)

      this.filePath = path.join(this.STORE_PATH, 'thief_data.json')
      this.backupFilePath = path.join(this.STORE_PATH, 'thief_data_backup.json')

      let json = safeReadJson(this.filePath)
      if (!json) {
        json = safeReadJson(this.backupFilePath)
      }
      if (!json || typeof json !== 'object') {
        json = {}
      }

      this.data = Object.assign({}, this.defaultConfig, json)
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
      this.createBackup()
      this.initialized = true
      return true
    } catch (err) {
      console.error('Database initialization error:', err)
      return false
    }
  },

  createBackup() {
    try {
      if (this.filePath && fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupFilePath)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to create config backup:', err)
      return false
    }
  },

  persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
  },

  get(key) {
    if (!this.initialized && !this.init()) {
      return this.defaultConfig[key]
    }
    return this.data[key] !== undefined ? this.data[key] : this.defaultConfig[key]
  },

  set(key, value) {
    try {
      if (!this.initialized && !this.init()) return false
      this.data[key] = value
      this.persist()
      this.createBackup()
      return true
    } catch (err) {
      console.error(`Error setting config '${key}':`, err)
      return false
    }
  },

  setBatch(configMap) {
    try {
      if (!this.initialized && !this.init()) return false
      Object.entries(configMap).forEach(([key, value]) => {
        this.data[key] = value
      })
      this.persist()
      this.createBackup()
      return true
    } catch (err) {
      console.error('Error setting batch config:', err)
      return false
    }
  },

  resetToDefault() {
    try {
      if (!this.initialized && !this.init()) return false
      this.data = Object.assign({}, this.defaultConfig)
      this.persist()
      this.createBackup()
      return true
    } catch (err) {
      console.error('Failed to reset config to defaults:', err)
      return false
    }
  },

  resetKeyToDefault(key) {
    if (key in this.defaultConfig) {
      return this.set(key, this.defaultConfig[key])
    }
    return false
  },

  exportConfig(targetPath) {
    try {
      if (!this.initialized && !this.init()) {
        return { success: false, message: '数据库初始化失败' }
      }
      fs.writeFileSync(targetPath, JSON.stringify(this.data, null, 2), 'utf8')
      return { success: true, message: '配置导出成功' }
    } catch (err) {
      return { success: false, message: `导出失败: ${err.message}` }
    }
  },

  importConfig(sourcePath) {
    try {
      if (!this.initialized && !this.init()) {
        return { success: false, message: '数据库初始化失败' }
      }
      const configContent = fs.readFileSync(sourcePath, 'utf8')
      const config = JSON.parse(configContent)
      this.data = Object.assign({}, this.defaultConfig, config)
      this.persist()
      this.createBackup()
      return { success: true, message: '配置导入成功' }
    } catch (err) {
      return { success: false, message: `导入失败: ${err.message}` }
    }
  },

  reloadConfig() {
    this.initialized = false
    return this.init()
  }
}