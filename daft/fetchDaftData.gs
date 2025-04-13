/* Сбор данных о локациях */

function fetchDaftData() {
  // Подготовка запроса
  const options = {
    method: "post",
    contentType: "application/json",
    headers: CONFIG.headers.api,
    payload: JSON.stringify({ "text": "galway" }),
    muteHttpExceptions: true
  };

  // Получение доступа к таблицам
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const dataSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.rawData);
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetNames.log);

  try {
    // Выполнение запроса
    const response = UrlFetchApp.fetch(CONFIG.urls.autocomplete, options);
    const jsonResponse = JSON.parse(response.getContentText());

    if (!Array.isArray(jsonResponse)) {
      throw new Error("Получены некорректные данные: ожидался массив");
    }

    // Подготовка данных для записи
    const dataToWrite = jsonResponse.map(item => [
      item.id,
      item.displayName,
      item.displayValue,
      item?.propertyCount?.residentialForRent || 0,
      item?.propertyCount?.sharing || 0
    ]);

    if (dataToWrite.length === 0) {
      throw new Error("Нет данных для записи");
    }

    // Очистка листа и запись данных
    dataSheet.clear();
    dataSheet.getRange(1, 1, 1, CONFIG.headers.sheets.rawData.length)
      .setValues([CONFIG.headers.sheets.rawData]);
    
    dataSheet.getRange(2, 1, dataToWrite.length, dataToWrite[0].length)
      .setValues(dataToWrite);

    // Логирование успеха
    Utils.updateLog(
      logSheet,
      "A",
      "Success",
      `Данные успешно получены. Записано ${dataToWrite.length} строк.`
    );

    // Логирование ошибки
  } catch (error) {
    Utils.updateLog(logSheet, "A", "Error", error.toString());
    Logger.log("Error fetching draft data: " + error);
  }
}
