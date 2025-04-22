/**
 * @fileoverview Менеджер работы с листами
 * Отвечает за операции с Google Sheets
 * @author ksatico
 * @lastmod 2025-04-13
 */

class SheetManager {
  /**
   * Получает список всех локаций из листов
   * @return {Array} Массив локаций
   */
  static getAllAreas() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    return CONFIG.sheets.areas.reduce((acc, sheetName) => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) return acc;

      const data = sheet.getDataRange().getValues();
      const areaData = data.slice(1)
        .filter(row => row[3])
        .map(([areaID, areaName, , shareUrl]) => ({
          id: areaID,
          name: areaName,
          url: shareUrl
        }));

      return [...acc, ...areaData];
    }, []);
  }

  /**
   * Сохраняет результаты парсинга
   * @param {Array} listings - Массив объявлений
   */
  static saveListings(listings) {
    if (listings.length === 0) return;

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.sheets.share) || 
                 spreadsheet.insertSheet(CONFIG.sheets.share);

    sheet.clear();
    sheet.getRange(1, 1, 1, CONFIG.dataStructure.share.length)
      .setValues([CONFIG.dataStructure.share]);
    
    sheet.getRange(2, 1, listings.length, CONFIG.dataStructure.share.length)
      .setValues(listings);
  }

  /**
   * Сохраняет данные о локациях
   * @param {Array} data - Массив данных о локациях 
   */
  static saveLocations(data) {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CONFIG.sheets.rawData);

    sheet.clear();
    sheet.getRange(1, 1, 1, CONFIG.dataStructure.rawData.length)
      .setValues([CONFIG.dataStructure.rawData]);
    
    sheet.getRange(2, 1, data.length, data[0].length)
      .setValues(data);
  }
}
