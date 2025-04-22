/**
 * @fileoverview Конфигурация приложения
 * Содержит все константы и настройки для работы скрипта
 * @author ksatico
 * @lastmod 2025-04-13
 */

const CONFIG = {
  // Основные настройки
  spreadsheetId: "1jtIJvJnngnCw_khmYXa-SdIhJOYbg98V-NDKN86mUZk",
  timezone: "Europe/Dublin",
  dateFormat: "dd-MM-yyyy HH:mm:ss",

  // Названия листов
  sheets: {
    rawData: "RawData",    // Сырые данные
    daft: "Daft",          // Форматированные данные
    share: "Share",        // Результаты парсинга
    log: "Data",          // Лог и статистика
    areas: ["GalwayCity", "GalwaySuburbs", "GalwayCounty"]  // Листы с регионами
  },

  // API настройки
  api: {
    urls: {
      autocomplete: "https://gateway.daft.ie/old/v1/autocomplete",
      base: "https://www.daft.ie"
    },
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "brand": "daft",
      "platform": "web",
      "version": "0",
      "Origin": "https://www.daft.ie",
      "Referer": "https://www.daft.ie/"
    }
  },

  // Структура данных
  dataStructure: {
    rawData: ["Area ID", "Area Name", "Area Slug", "Rent", "Share"],
    share: ["ID", "Address", "Price", "Meta", "Link", "Area ID", "Area Name"]
  },

  // Настройки выполнения
  execution: {
    delays: {
      min: 10000,  // 10 секунд
      max: 70000   // 70 секунд
    },
    batch: {
      size: 5,              // Количество локаций в одной партии
      maxRunTime: 270000,   // 4.5 минуты
      triggerDelay: 60000   // 1 минута между партиями
    }
  }
};
