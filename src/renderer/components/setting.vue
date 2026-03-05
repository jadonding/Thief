<template>
  <el-container class="container">
    <div class="leftx">
      <div style="width:500px;">
        <el-form style="width:500px;" ref="form" :model="form" label-width="100px">
          <el-form-item label="小说路径">
            <el-input style="width:80.5%;margin-top: 7px;" v-model="form.file_path" size="mini" placeholder="请选择小说路径"
              prefix-icon="el-icon-tickets">
              <template slot="prepend">
                <el-checkbox :border="true" size="mini" id="lm" v-model="form.errCodeChecked"
                  :checked="lmchecked">乱码</el-checkbox>
              </template>
            </el-input>
            <el-button type="primary" size="mini" @click="openTxt">
              <i class="el-icon-folder-opened"></i>
            </el-button>
          </el-form-item>

          <el-col :span="12">
            <el-form-item label="当前页数">
              <el-input-number size="mini" controls-position="right" :min="1" :max="999999999"
                v-model="form.curr_page"></el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="每页数量">
              <el-input-number v-if="form.curr_model == '1'" size="mini" controls-position="right" :min="5"
                v-model="form.page_size"></el-input-number>

              <el-input-number v-else size="mini" controls-position="right" :min="5"
                v-model="form.page_size"></el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="是否英文">
              <el-switch v-model="form.is_english"></el-switch>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="换行符号">
              <el-input style="width:111px;" v-model="form.line_break" maxlength="5" size="mini" placeholder="换行符号"
                prefix-icon="el-icon-sugar"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="字体大小">
              <el-input-number size="mini" controls-position="right" :min="12" :max="100"
                v-model="form.font_size"></el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="自动翻页(秒)">
              <el-input-number size="mini" controls-position="right" :min="1" :max="60"
                v-model="form.second"></el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="背景色">
              <el-color-picker v-model="form.bg_color" show-alpha></el-color-picker>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="文字颜色">
              <el-color-picker v-model="form.txt_color" show-alpha></el-color-picker>
            </el-form-item>
          </el-col>

          <el-col :span="11">
            <el-form-item label="上一页">
              <el-select style="width:138px;" v-model="keyPrevious" size="mini" placeholder="请选择">
                <el-option label="Alt" value="Alt"></el-option>
                <el-option label="CmdOrCtrl" value="CmdOrCtrl"></el-option>
                <el-option label="CmdOrCtrl+Alt" value="CmdOrCtrl+Alt"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col style="text-align: center;margin-top: 10px; margin-left: 10px;" :span="2">
            <span>+</span>
          </el-col>

          <el-col :span="10">
            <el-form-item>
              <el-input style="width:179px;margin-left: -100px;" v-model="keyPreviousX" maxlength="100" size="mini"
                placeholder="请输入按键" prefix-icon="el-icon-grape" @focus="onPreviousFocus"
                @blur="onPreviousBlur"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="11">
            <el-form-item label="下一页">
              <el-select style="width:138px;" v-model="keyNext" size="mini" placeholder="请选择">
                <el-option label="Alt" value="Alt"></el-option>
                <el-option label="CmdOrCtrl" value="CmdOrCtrl"></el-option>
                <el-option label="CmdOrCtrl+Alt" value="CmdOrCtrl+Alt"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col style="text-align: center;margin-top: 10px; margin-left: 10px;" :span="2">
            <span>+</span>
          </el-col>

          <el-col :span="10">
            <el-form-item>
              <el-input style="width:179px;margin-left: -100px;" v-model="keyNextX" maxlength="100" size="mini"
                placeholder="请输入按键" prefix-icon="el-icon-grape" @focus="onNextFocus" @blur="onNextBlur"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="11">
            <el-form-item label="老板键">
              <el-select style="width:138px;" v-model="keyBoss" size="mini" placeholder="请选择">
                <el-option label="Alt" value="Alt"></el-option>
                <el-option label="CmdOrCtrl" value="CmdOrCtrl"></el-option>
                <el-option label="CmdOrCtrl+Alt" value="CmdOrCtrl+Alt"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col style="text-align: center;margin-top: 10px; margin-left: 10px;" :span="2">
            <span>+</span>
          </el-col>

          <el-col :span="10">
            <el-form-item>
              <el-input style="width:179px;margin-left: -100px;" v-model="keyBossX" maxlength="100" size="mini"
                placeholder="请输入按键" prefix-icon="el-icon-grape" @focus="onBossFocus" @blur="onBossBlur"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="11">
            <el-form-item label="自动翻页">
              <el-select style="width:138px;" v-model="keyAuto" size="mini" placeholder="请选择">
                <el-option label="Alt" value="Alt"></el-option>
                <el-option label="CmdOrCtrl" value="CmdOrCtrl"></el-option>
                <el-option label="CmdOrCtrl+Alt" value="CmdOrCtrl+Alt"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col style="text-align: center;margin-top: 10px; margin-left: 10px;" :span="2">
            <span>+</span>
          </el-col>

          <el-col :span="10">
            <el-form-item>
              <el-input style="width:179px;margin-left: -100px;" v-model="keyAutoX" maxlength="100" size="mini"
                placeholder="请输入按键" prefix-icon="el-icon-grape" @focus="onAutoFocus" @blur="onAutoBlur"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24" style="text-align: center;">
            <el-button style="width: 91%;" type="primary" size="mini" @click="onSubmit">保存</el-button>
          </el-col>
          
          <!-- 配置导入导出 -->
          <el-col :span="12" style="text-align: center; margin-top: 10px;">
            <el-button style="width: 80%;" type="success" size="mini" @click="exportConfig">导出配置</el-button>
          </el-col>
          <el-col :span="12" style="text-align: center; margin-top: 10px;">
            <el-button style="width: 80%;" type="warning" size="mini" @click="importConfig">导入配置</el-button>
          </el-col>
     
        </el-form>
      </div>
    </div>

    <div class="rightx">
      <div class="toolx">
        <el-form style="width:300px;" label-width="70px">
          <el-form-item label="显示分页">
            <el-switch v-model="is_display_page"></el-switch>
          </el-form-item>
          <el-form-item label="摸鱼文字">
            <el-input style="width:130px;" v-model="moyu_text" maxlength="100" size="mini" placeholder="请输入摸鱼文字"
              prefix-icon="el-icon-umbrella"></el-input>
          </el-form-item>
          <el-form-item label="股票代码">
            <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
              <el-button type="success" size="mini" icon="el-icon-refresh" @click="refreshStockData" 
                :loading="stockRefreshLoading">
                {{ stockRefreshLoading ? '获取中...' : '获取全A股数据' }}
              </el-button>
              <span style="font-size: 12px; color: #999;" v-if="stockCacheInfo.count > 0">
                已缓存 {{ stockCacheInfo.count }} 条股票数据
                <br>
                更新时间: {{ formatUpdateTime(stockCacheInfo.updateTime) }}
              </span>
            </div>
            <div v-for="(codeObj, index) in stock_code" :key="index" style="align-items: center; margin-bottom: 5px;">
              <el-input style="width:100px;" v-model="stockDisplay[index]" size="mini" placeholder="代码/名称"
                @blur="updateStockCodeFromInput(index)"></el-input>
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="removeStockCode(index)"
                style="margin-left: 6px;"></el-button>
            </div>
            <el-autocomplete v-model="stockSearchQuery" size="mini" :fetch-suggestions="onStockSearch"
              placeholder="输入股票名称或代码" @select="selectStock" style="width: 100px; margin-top: 5px;">
              <template slot-scope="{ item }">
                <div style="display: flex; justify-content: space-between;">
                  <span>{{ item.name }}</span>
                  <span>{{ item.code }}</span>
                </div>
              </template>
            </el-autocomplete>
            <el-button type="primary" size="mini" icon="el-icon-plus" @click="addStockCode"
              style="margin-top: 5px;">添加股票代码</el-button>
          </el-form-item>

          <!-- 涨停告警配置 -->
          <el-form-item label="涨停告警">
            <el-switch v-model="limit_up_alert_enabled"></el-switch>
          </el-form-item>

          <el-form-item label="钉钉Webhook" v-if="limit_up_alert_enabled">
            <el-input style="width:200px;" v-model="dingtalk_webhook" size="mini" placeholder="钉钉机器人Webhook地址"
              prefix-icon="el-icon-link"></el-input>
          </el-form-item>

          <el-form-item label="@用户手机号" v-if="limit_up_alert_enabled">
            <div v-for="(phone, index) in at_phone_numbers" :key="index"
              style="align-items: center; margin-bottom: 5px;">
              <el-input style="width:130px;" v-model="at_phone_numbers[index]" size="mini" placeholder="手机号"
                maxlength="11"></el-input>
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="removePhoneNumber(index)"
                style="margin-left: 6px;"></el-button>
            </div>
            <el-button type="primary" size="mini" icon="el-icon-plus" @click="addPhoneNumber"
              style="margin-top: 5px;">添加手机号</el-button>
          </el-form-item>

        </el-form>
      </div>
    </div>
  </el-container>
</template>

<script>
import db from "../../main/utils/db";
import dialog from "../utils/dialog";
import { ipcRenderer, shell } from "electron";
import hotkeys from "hotkeys-js";
import stockUtils from "../../main/utils/stock";

export default {
  name: "setting", data() {
    return {
      form: {
        file_path: "",
        curr_page: 1,
        page_size: 5,
        is_english: false,
        line_break: " ",
        bg_color: "",
        txt_color: "",
        curr_model: "1",
        key_previous: "",
        key_next: "",
        key_boss: "",
        key_auto: "",
        lmchecked: false,
        key_type: 0
      },
      is_display_page: true,
      is_display_joke: false,
      is_display_shares: false,
      stock_code: [], // 存储 { code: string, name: string }
      stockDisplay: [], // 用于 v-model，显示名称或代码
      moyu_text: "",
      keyPrevious: "Alt",
      keyPreviousX: "",
      keyNext: "Alt",
      keyNextX: "",
      keyBoss: "Alt",
      keyBossX: "",
      keyAuto: "Alt",
      keyAutoX: "",
      stockSearchQuery: "",
      selectedStock: null,
      selectedStocks: [],
      stockSearchResults: [],
      // 涨停告警相关
      limit_up_alert_enabled: false,
      dingtalk_webhook: "",
      at_phone_numbers: [],
      // 股票数据刷新相关
      stockRefreshLoading: false,
      stockCacheInfo: {
        count: 0,
        updateTime: '',
        isInitialized: false
      }
    };
  },
  created() {
    this.onLoad();
    this.onKey();
    this.loadStockCacheInfo();
  },
  methods: {
    updateStockCodeFromInput(index) {
      const inputValue = this.stockDisplay[index] ? this.stockDisplay[index].trim() : "";

      // 确保 stock_code[index] 存在且为对象
      if (!this.stock_code[index] || typeof this.stock_code[index] !== 'object') {
        this.$set(this.stock_code, index, { code: "", name: "" });
      }

      if (!inputValue) {
        // 如果输入被清空，也清空对应的 stock_code 条目
        this.stock_code[index].code = "";
        this.stock_code[index].name = "";
        return;
      }

      // 首先确保股票缓存已初始化
      if (!stockUtils.isStockCacheInitialized) {
        stockUtils.initializeStockCache().then(() => {
          this.performStockSearch(index, inputValue);
        });
      } else {
        this.performStockSearch(index, inputValue);
      }
    },

    performStockSearch(index, inputValue) {
      const results = stockUtils.searchStocks(inputValue);
      let matchedStock = null;

      if (results && results.length > 0) {
        // 1. 尝试精确代码匹配
        matchedStock = results.find(s => s.code === inputValue);
        // 2. 如果无精确代码匹配，尝试精确名称匹配
        if (!matchedStock) {
          matchedStock = results.find(s => s.name === inputValue);
        }
        // 3. 如果仍然没有匹配，且搜索结果只有一个，则使用该结果
        if (!matchedStock && results.length === 1) {
          matchedStock = results[0];
        }
      }

      if (matchedStock) {
        this.stock_code[index].code = matchedStock.code;
        this.stock_code[index].name = matchedStock.name;
        this.$set(this.stockDisplay, index, matchedStock.name || matchedStock.code);
      } else {
        // 未找到明确匹配项，将输入视为代码或名称
        this.stock_code[index].code = inputValue;
        
        // 根据输入格式判断是代码还是名称
        if (/^[0-9]{6}$/.test(inputValue) || /^(sh|sz|bj)[0-9]{6}$/i.test(inputValue)) {
          // 是代码格式
          this.stock_code[index].name = "";
        } else {
          // 不是标准代码格式，视为名称
          this.stock_code[index].name = inputValue;
        }
        
        this.$set(this.stockDisplay, index, inputValue);
      }
    },
    addStockCode() {
      this.stock_code.push({ code: "", name: "" });
      this.stockDisplay.push("");
    },
    removeStockCode(index) {
      this.stock_code.splice(index, 1);
      this.stockDisplay.splice(index, 1);
    },
    addPhoneNumber() {
      this.at_phone_numbers.push("");
    },
    removePhoneNumber(index) {
      this.at_phone_numbers.splice(index, 1);
    },
    onModel1() {
      if (this.is_display_joke) {
        this.is_display_shares = false;
      }
    },
    onModel2() {
      if (this.is_display_shares) {
        this.is_display_joke = false;
      }
    },
    openUrl() {
      shell.openExternal("https://c.team");
    },
    onPreviousFocus() {
      this.keyPreviousX = "";
      this.key_type = 1;
    },
    onNextFocus() {
      this.keyNextX = "";
      this.key_type = 2;
    },
    onBossFocus() {
      this.keyBossX = "";
      this.key_type = 3;
    },
    onAutoFocus() {
      this.keyAutoX = "";
      this.key_type = 4;
    },
    onPreviousBlur() {
      this.key_type = 0;
    },
    onNextBlur() {
      this.key_type = 0;
    },
    onBossBlur() {
      this.key_type = 0;
    },
    onAutoBlur() {
      this.key_type = 0;
    },
    onKey() {
      var that = this;

      hotkeys.filter = function (event) {
        return true;
      };

      hotkeys("*", function (e) {
        if (
          e.key != "Control" &&
          e.key != "Meta" &&
          e.key != "Alt" &&
          e.key != "Shift" &&
          e.key != "Backspace" &&
          e.key != "CapsLock" &&
          e.key != "Enter" &&
          e.key != "Tab" &&
          e.key != "Escape" &&
          e.key != "Numlock" &&
          e.key != "F5"
        ) {
          var keyx = "";
          if (e.key === "ArrowLeft") {
            keyx = "Left";
          } else if (e.key === "ArrowUp") {
            keyx = "Up";
          } else if (e.key === "ArrowDown") {
            keyx = "Down";
          } else if (e.key === "ArrowRight") {
            keyx = "Right";
          } else if (e.key.trim() === "") {
            keyx = "不能为空格,请删掉重新输入";
          }

          if (that.key_type == 1) {
            if (keyx != "") {
              that.keyPreviousX = keyx;
            }
          } else if (that.key_type == 2) {
            if (keyx != "") {
              that.keyNextX = keyx;
            }
          } else if (that.key_type == 3) {
            if (keyx != "") {
              that.keyBossX = keyx;
            }
          } else if (that.key_type == 4) {
            if (keyx != "") {
              that.keyAutoX = keyx;
            }
          }
        }
      });
    },
    onLoad() {
      this.form.curr_page = db.get("current_page");
      this.form.page_size = db.get("page_size");
      this.form.is_english = db.get("is_english");
      this.form.line_break = db.get("line_break");
      this.form.file_path = db.get("current_file_path");
      this.form.bg_color = db.get("bg_color");
      this.form.txt_color = db.get("txt_color");
      this.form.curr_model = db.get("curr_model");
      this.form.font_size = db.get("font_size");
      this.form.second = db.get("second");

      var key_previous = db.get("key_previous");
      var arr = key_previous.split("+");
      if (arr.length === 2) {
        this.keyPrevious = arr[0];
        this.keyPreviousX = arr[1];
      } else if (arr.length === 3) {
        this.keyPrevious = arr[0] + "+" + arr[1];
        this.keyPreviousX = arr[2];
      }

      var key_next = db.get("key_next");
      var arr = key_next.split("+");
      if (arr.length === 2) {
        this.keyNext = arr[0];
        this.keyNextX = arr[1];
      } else if (arr.length === 3) {
        this.keyNext = arr[0] + "+" + arr[1];
        this.keyNextX = arr[2];
      }

      var key_boss = db.get("key_boss");
      var arr = key_boss.split("+");
      if (arr.length === 2) {
        this.keyBoss = arr[0];
        this.keyBossX = arr[1];
      } else if (arr.length === 3) {
        this.keyBoss = arr[0] + "+" + arr[1];
        this.keyBossX = arr[2];
      }

      var key_auto = db.get("key_auto");
      var arr = key_auto.split("+");
      if (arr.length === 2) {
        this.keyAuto = arr[0];
        this.keyAutoX = arr[1];
      } else if (arr.length === 3) {
        this.keyAuto = arr[0] + "+" + arr[1];
        this.keyAutoX = arr[2];
      }

      this.lmchecked = db.get("errCodeChecked");

      this.is_display_page = db.get("is_display_page");

      const savedStocks = db.get("display_shares_list") || [];
      this.stock_code = savedStocks.map(stock => ({
        code: stock.code,
        name: stock.name || "" // 确保 name 存在，即使是空字符串
      })); 
      
      this.stockDisplay = this.stock_code.map(stock => stock.name || stock.code); // 优先显示名称

      this.moyu_text = db.get("moyu_text");

      // 加载涨停告警配置
      this.limit_up_alert_enabled = db.get("limit_up_alert_enabled") || false;
      this.dingtalk_webhook = db.get("dingtalk_webhook") || "";
      this.at_phone_numbers = db.get("at_phone_numbers") || [];
    },
    openTxt() {
      var that = this;
      dialog.showOpenFile(function (e) {
        that.form.file_path = e[0];
      });
    },
    onSubmit() {
      console.log('开始保存配置...');
      console.log('当前股票代码原始数据:', JSON.stringify(this.stock_code));
      console.log('股票代码数据类型:', typeof this.stock_code);
      console.log('股票代码是否为数组:', Array.isArray(this.stock_code));
      
      // 确保股票代码数据格式正确
      const stockList = Array.isArray(this.stock_code) 
        ? this.stock_code.filter(stock => stock && stock.code && stock.code.trim()) 
        : [];
      
      console.log('清理后的股票代码:', JSON.stringify(stockList));
      
      // 准备所有配置数据
      const configData = {
        "current_page": this.form.curr_page,
        "page_size": this.form.page_size,
        "is_english": this.form.is_english,
        "line_break": this.form.line_break,
        "current_file_path": this.form.file_path,
        "bg_color": this.form.bg_color,
        "txt_color": this.form.txt_color,
        "font_size": this.form.font_size,
        "second": this.form.second,
        "key_previous": this.keyPrevious + "+" + this.keyPreviousX,
        "key_next": this.keyNext + "+" + this.keyNextX,
        "key_boss": this.keyBoss + "+" + this.keyBossX,
        "key_auto": this.keyAuto + "+" + this.keyAutoX,
        "errCodeChecked": this.form.errCodeChecked,
        "is_display_page": this.is_display_page,
        "display_shares_list": stockList, // 使用清理后的股票数据
        "moyu_text": this.moyu_text,
        "limit_up_alert_enabled": this.limit_up_alert_enabled,
        "dingtalk_webhook": this.dingtalk_webhook,
        "at_phone_numbers": this.at_phone_numbers
      };
      
      console.log('即将保存的配置数据 display_shares_list:', JSON.stringify(configData.display_shares_list));
      
      // 使用批量保存
      const batchSuccess = db.setBatch(configData);
      
      if (!batchSuccess) {
        // 如果批量保存失败，使用逐个保存的方式
        console.warn('批量保存失败，尝试逐个保存');
        
        Object.entries(configData).forEach(([key, value]) => {
          const success = db.set(key, value);
          if (!success) {
            console.error(`保存配置项 ${key} 失败`);
          }
        });
      }
      
      // 立即通知主进程更新股票监控（不等待验证）
      ipcRenderer.send("update_stock_monitor", this.limit_up_alert_enabled);
      
      // 更新UI
      console.log('准备发送bg_text_color事件，当前颜色配置:');
      console.log('背景色:', this.form.bg_color);
      console.log('文字颜色:', this.form.txt_color);
      
      ipcRenderer.send("bg_text_color", "ping");

      // 验证配置保存
      setTimeout(() => {
        const configSaved = this.checkConfigSaved();
        if (configSaved) {
          console.log('配置保存成功并已验证');
          
          this.$message({
            message: "保存成功，请尽情的摸鱼吧！",
            type: "success",
            showClose: true
          });
        } else {
          console.error('配置保存失败或不一致');
          
          // 尝试强制重新保存
          db.set("display_shares_list", this.stock_code);
          
          // 再次通知主进程更新股票监控
          setTimeout(() => {
            ipcRenderer.send("update_stock_monitor", this.limit_up_alert_enabled);
            
            // 再次验证
            const retrySuccess = this.checkConfigSaved();
            if (retrySuccess) {
              console.log('重试保存成功');
              this.$message({
                message: "配置已成功保存",
                type: "success",
                showClose: true
              });
            } else {
              console.error('重试保存仍然失败');
              this.$message({
                message: "配置保存可能有问题，请重新设置",
                type: "warning",
                showClose: true
              });
            }
          }, 300);
        }
      }, 200);
    },
    async onStockSearch(queryString, cb) {
      try {
        if (!queryString || !queryString.trim()) {
          cb([]);
          return;
        }
        
        // 确保股票工具已初始化
        if (!stockUtils.isStockCacheInitialized) {
          await stockUtils.initializeStockCache();
        }
        
        const results = stockUtils.searchStocks(queryString.trim());
        
        // 格式化结果以适应el-autocomplete的显示要求
        const formattedResults = results.map(stock => ({
          value: stock.name && stock.name.trim() ? `${stock.name} (${stock.code})` : stock.code,
          name: stock.name || stock.code,
          code: stock.code
        }));
        
        cb(formattedResults);
      } catch (error) {
        console.error('股票搜索出错:', error);
        cb([]);
      }
    },

    selectStock(stock) { // stock is { value: "...", name: "...", code: "..." }
      // 检查股票代码是否已存在
      const existingStockIndex = this.stock_code.findIndex(s => s.code === stock.code);

      if (existingStockIndex === -1) {
        // 不存在则添加到列表末尾
        this.stock_code.push({ code: stock.code, name: stock.name });
        this.stockDisplay.push(stock.name || stock.code);
      } else {
        // 如果已存在，更新其名称，并更新显示
        this.stock_code[existingStockIndex].name = stock.name;
        this.$set(this.stockDisplay, existingStockIndex, stock.name || stock.code);
        this.$message({
          message: `股票 ${stock.code} 已在列表中，信息已更新。`,
          type: "info",
          showClose: true
        });
      }
      this.stockSearchQuery = ""; // 清空搜索框
    },

    onStockSelect(stocks) {
    },

    // 导出配置
    exportConfig() {
      const { remote } = require('electron');
      const { dialog } = remote;
      
      dialog.showSaveDialog({
        title: '导出配置',
        defaultPath: 'thief_config.json',
        filters: [
          { name: '配置文件', extensions: ['json'] }
        ]
      }).then(result => {
        if (!result.canceled && result.filePath) {
          // 发送IPC消息给主进程
          ipcRenderer.send('export-config', result.filePath);
          
          // 监听结果
          ipcRenderer.once('export-config-result', (event, response) => {
            if (response.success) {
              this.$message.success(response.message);
            } else {
              this.$message.error(response.message);
            }
          });
        }
      }).catch(err => {
        this.$message.error(`导出失败: ${err.message}`);
      });
    },
    
    // 导入配置
    importConfig() {
      const { remote } = require('electron');
      const { dialog } = remote;
      
      dialog.showOpenDialog({
        title: '导入配置',
        filters: [
          { name: '配置文件', extensions: ['json'] }
        ],
        properties: ['openFile']
      }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
          // 确认导入
          this.$confirm('导入配置将覆盖当前所有设置，是否继续？', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            // 发送IPC消息给主进程
            ipcRenderer.send('import-config', result.filePaths[0]);
            
            // 监听结果
            ipcRenderer.once('import-config-result', (event, response) => {
              if (response.success) {
                this.$message.success(response.message);
                // 重新加载配置
                this.onLoad();
              } else {
                this.$message.error(response.message);
              }
            });
          }).catch(() => {
            this.$message.info('已取消导入');
          });
        }
      }).catch(err => {
        this.$message.error(`导入失败: ${err.message}`);
      });
    },

    // 检查配置是否正确保存
    checkConfigSaved() {
      // 直接从本地读取配置文件
      try {
        const fs = require('fs-extra');
        const path = require('path');
        const electron = require('electron');
        const app = electron.remote.app;
        const userData = app.getPath('userData');
        const configPath = path.join(userData, '/thief_data.json');
        
        console.log('配置文件路径:', configPath);
        
        if (fs.existsSync(configPath)) {
          const configContent = fs.readFileSync(configPath, 'utf8');
          const configObj = JSON.parse(configContent);
          
          console.log('配置文件中的股票代码:', JSON.stringify(configObj.display_shares_list || []));
          console.log('当前界面中的股票代码:', JSON.stringify(this.stock_code));
          
          // 检查是否一致
          const fileStocks = JSON.stringify(configObj.display_shares_list || []);
          const currentStocks = JSON.stringify(this.stock_code);
          
          if (fileStocks !== currentStocks) {
            console.error('配置保存不一致！文件中的配置与当前不匹配');
            return false;
          }
          
          return true;
        } else {
          console.error('配置文件不存在:', configPath);
          return false;
        }
      } catch (err) {
        console.error('检查配置保存状态失败:', err);
        return false;
      }
    },

    // 加载股票缓存信息
    loadStockCacheInfo() {
      ipcRenderer.send('get_stock_cache_info');
      
      ipcRenderer.once('get_stock_cache_info_result', (event, response) => {
        if (response.success) {
          this.stockCacheInfo = response.data;
        } else {
          console.error('获取股票缓存信息失败:', response.message);
        }
      });
    },

    // 刷新股票数据
    refreshStockData() {
      this.stockRefreshLoading = true;
      
      ipcRenderer.send('refresh_stock_data');
      
      ipcRenderer.once('refresh_stock_data_result', (event, response) => {
        this.stockRefreshLoading = false;
        
        if (response.success) {
          this.$message({
            message: response.message,
            type: 'success',
            showClose: true
          });
          
          // 刷新缓存信息
          this.loadStockCacheInfo();
        } else {
          this.$message({
            message: response.message,
            type: 'error',
            showClose: true
          });
        }
      });
    },

    // 格式化更新时间
    formatUpdateTime(timeStr) {
      if (!timeStr || timeStr === '未知') {
        return '未知';
      }
      
      try {
        const date = new Date(timeStr);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return '未知';
      }
    },
  }
};
</script>

<style scoped lang="scss">
.container {
  margin: 10px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  .leftx {
    width: 520px;
  }

  .rightx {
    width: 220px;
    text-align: left;
    line-height: 8px;

    .toolx {
      height: 410px;
      padding: 10px 0 0 0;

      .nbx {
        writing-mode: vertical-rl;
        font-size: 14px;
        letter-spacing: 6px;
        margin-left: 0px;
        background: #585858;
        padding: 7px 80px 7px 80px;
        margin-top: -7px;
        color: #ffffff;
        border-radius: 8px;
        font-size: 12px;
      }
    }

    .sizex {
      font-size: 18px;
      line-height: 35px;
      font-weight: bold;
    }

    .cteamx {
      background: #38393a;
      line-height: 24px;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
    }
  }
}

.el-input-number--mini {
  width: 111px;
  line-height: 26px;
}

.el-checkbox__input {
  cursor: pointer;
  outline: 0;
  line-height: 1;
  vertical-align: middle;
  margin-right: -7px;
}

#lm {
  margin-left: -17px;
  margin-right: -17px;

  .el-checkbox__label {
    display: inline-block;
    padding-left: 10px;
    line-height: 19px;
    font-size: 12px;
  }
}

.el-checkbox.is-bordered.el-checkbox--mini {
  height: 26px;
  border: 0px;
}

.el-checkbox.is-bordered.is-checked {
  border: 0px;
}

.el-form-item__content {
  margin-left: 0px;
}
</style>
