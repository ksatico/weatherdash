/**
 * @fileoverview Обработчик данных
 * Отвечает за получение и обработку данных
 * @author ksatico
 * @lastmod 2025-04-13
 */

class DataProcessor {
  /**
   * Сохраняет данные о локациях (RawData) с логированием
   * @return {void}
   */
  static async fetchAndSaveRawData() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = spreadsheet.getSheetByName(CONFIG.sheets.log);

    try {
      Logger.logProgress("In Progress", "Сбор сырых данных начат", "A");

      const rawData = await this.fetchLocations(); // Получение данных о локациях
      SheetManager.saveLocations(rawData); // Сохранение на лист RawData

      Logger.logProgress("Success", `Сырые данные успешно записаны. Количество строк: ${rawData.length}`, "A");
    } catch (error) {
      Logger.logError(error, "fetchAndSaveRawData");
      Logger.logProgress("Error", `Ошибка при сборе сырых данных: ${error.message}`, "A");
    }
  }

  /**
   * Получает данные о локациях с Daft
   * @return {Array} Массив данных о локациях
   */
  static async fetchLocations() {
    const options = {
      method: "post",
      contentType: "application/json",
      headers: CONFIG.api.headers,
      payload: JSON.stringify({ "text": "galway" }),
      muteHttpExceptions: true
    };

    try {
      const response = await UrlFetchApp.fetch(CONFIG.api.urls.autocomplete, options);
      const data = JSON.parse(response.getContentText());

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: array expected");
      }

      return data.map(item => [
        item.id,
        item.displayName,
        item.displayValue,
        item?.propertyCount?.residentialForRent || 0,
        item?.propertyCount?.sharing || 0
      ]);

    } catch (error) {
      Logger.logError(error, "fetchLocations");
      throw error;
    }
  }

  /**
   * Получает объявления для конкретной локации
   * @param {Object} area - Информация о локации
   * @return {Array} Массив объявлений
   */
  static async fetchListings(area) {
    try {
      const response = await UrlFetchApp.fetch(area.url, {
        muteHttpExceptions: true,
        followRedirects: true
      });

      if (response.getResponseCode() !== 200) {
        throw new Error(`HTTP ${response.getResponseCode()}`);
      }

      const html = response.getContentText();
      return this.parseListings(html, area);

    } catch (error) {
      Logger.logError(error, `fetchListings: ${area.name}`);
      return [];
    }
  }

  /**
   * Парсит HTML и извлекает объявления
   * @param {string} html - HTML-код страницы
   * @param {Object} area - Информация о локации
   * @return {Array} Массив объявлений
   */
  static parseListings(html, area) {
    const regex = /<li data-testid="result-(\d+)"[^>]*>.*?<a href="([^"]+)"[^>]*>.*?data-tracking="srp_address".*?<p[^>]*>(.*?)<\/p>.*?data-tracking="srp_price".*?<p[^>]*>(.*?)<\/p>.*?data-tracking="srp_meta".*?<div[^>]*>(.*?)<\/div>/gs;
    const matches = [...html.matchAll(regex)];
    
    return matches.map(([_, id, link, address, price, meta]) => [
      id,
      address.trim(),
      price.trim(),
      meta.trim(),
      `${CONFIG.api.urls.base}${link}`,
      area.id,
      area.name
    ]);
  }
}
