/**
 * @fileoverview Расширенная система логирования
 * Обеспечивает логирование в лист Data и консоль
 * @author ksatico
 * @lastmod 2025-04-13
 */

class Logger {
  /**
   * Записывает прогресс обработки
   * @param {string} status - Статус обработки
   * @param {string} message - Сообщение о прогрессе
   * @param {string} column - Колонка в листе Data
   */
  static logProgress(status, message, column = "D") {
    console.log(`${status}: ${message}`);
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = spreadsheet.getSheetByName(CONFIG.sheets.log);
    if (!logSheet) return;

    const timestamp = Utilities.formatDate(
      new Date(),
      CONFIG.timezone,
      CONFIG.dateFormat
    );

    logSheet.getRange(`${column}8:${column}10`)
      .setValues([[status], [message], [timestamp]]);
  }

  /**
   * Записывает ошибку
   * @param {Error} error - Объект ошибки
   * @param {string} context - Контекст возникновения ошибки
   */
  static logError(error, context) {
    const message = `Error in ${context}: ${error.toString()}`;
    console.error(message);
    this.logProgress("Error", message);
  }

  /**
   * Записывает отладочную информацию
   * @param {string} message - Отладочное сообщение 
   */
  static debug(message) {
    console.log(message);
  }
}
