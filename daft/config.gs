/* Общая конфигурация для всех скриптов */

const CONFIG = {
  // Конфигурационные параметры
  spreadsheetId: "1jtIJvJnngnCw_khmYXa-SdIhJOYbg98V-NDKN86mUZk",
  sheetNames: {
    rawData: "RawData",
    daft: "Daft",
    share: "Share",
    log: "Data",
    areas: ["GalwayCity", "GalwaySuburbs", "GalwayCounty"]
  },
  urls: {
    autocomplete: "https://gateway.daft.ie/old/v1/autocomplete",
    base: "https://www.daft.ie"
  },
  headers: {
    api: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "brand": "daft",
      "platform": "web",
      "version": "0",
      "Origin": "https://www.daft.ie",
      "Referer": "https://www.daft.ie/"
    },
    sheets: {
      rawData: ["Area ID", "Area Name", "Area Slug", "Rent", "Share"],
      share: ["ID", "Address", "Price", "Meta", "Link", "Area ID", "Area Name"]
    }
  },
  delays: {
    min: 10000,  // 10 секунд
    max: 70000   // 70 секунд
  },
  // Добавляем новые параметры
  processing: {
    batchSize: 5,        // Количество локаций в одной партии
    maxRunTime: 270000,  // 4.5 минуты в миллисекундах (оставляем запас)
    stateSheet: "ProcessingState" // Имя листа для хранения состояния обработки
  }
};

/* Общие утилиты */

// Форматирование временной метки
const Utils = {
  formatTimestamp() {
    return Utilities.formatDate(
      new Date(),
      "Europe/Dublin",
      "dd-MM-yyyy HH:mm:ss"
    );
  },

  // Вспомогательная функция для обновления лога
  updateLog(sheet, column, status, message) {
    const timestamp = this.formatTimestamp();
    const logData = [[status], [message], [timestamp]];
    sheet.getRange(`${column}8:${column}10`).setValues(logData);
  },

  getRandomDelay() {
    return Math.floor(Math.random() * (CONFIG.delays.max - CONFIG.delays.min)) + CONFIG.delays.min;
  }
};
