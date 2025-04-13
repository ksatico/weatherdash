// Основная функция запуска
function startFetchDaftListings() {
  Logger.log("Starting the fetch process...");
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.log);
    Logger.log("Got access to spreadsheet and log sheet");

    // Проверяем и выводим информацию о листах
    CONFIG.sheetNames.areas.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      Logger.log(`Sheet ${sheetName} exists: ${!!sheet}`);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        Logger.log(`${sheetName} has ${data.length} rows`);
      }
    });

    // Собираем все области для обработки
    const areaList = CONFIG.sheetNames.areas.reduce((acc, sheetName) => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log(`Sheet ${sheetName} not found`);
        return acc;
      }

      const data = sheet.getDataRange().getValues();
      Logger.log(`Processing ${sheetName}: ${data.length} rows`);
      
      const areaData = data.slice(1)
        .filter(row => {
          const hasUrl = !!row[3];
          if (!hasUrl) {
            Logger.log(`Row in ${sheetName} skipped - no URL: ${row}`);
          }
          return hasUrl;
        })
        .map(([areaID, areaName, , shareUrl]) => ({
          id: areaID,
          name: areaName,
          url: shareUrl
        }));

      Logger.log(`Found ${areaData.length} valid areas in ${sheetName}`);
      return [...acc, ...areaData];
    }, []);

    Logger.log(`Total areas found: ${areaList.length}`);

    if (areaList.length === 0) {
      const error = "No areas found for parsing.";
      Logger.log(`Error: ${error}`);
      throw new Error(error);
    }

    // Очищаем существующие триггеры
    cleanupAllTriggers();
    Logger.log("Existing triggers cleared");

    // Инициализируем состояние
    ProcessingState.save(0, areaList.length, []);
    Logger.log("Processing state initialized");

    // Создаем триггер для выполнения первой партии
    const trigger = ScriptApp.newTrigger('processBatch')
      .timeBased()
      .after(60000) // 1 минута
      .create();
    
    Logger.log(`Trigger created with ID: ${trigger.getUniqueId()}`);

    Utils.updateLog(
      logSheet,
      "D",
      "In Progress",
      `Начат процесс обработки ${areaList.length} локаций. Первая партия запустится через 1 минуту.`
    );
    Logger.log("Initial log entry created");

  } catch (error) {
    Logger.log(`Error occurred: ${error.toString()}`);
    const logSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.sheetNames.log);
    Utils.updateLog(logSheet, "D", "Error", error.toString());
  }
}

// Функция проверки триггеров
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`Current triggers count: ${triggers.length}`);
  triggers.forEach(trigger => {
    Logger.log(`Trigger: ${trigger.getHandlerFunction()} - ${trigger.getUniqueId()}`);
  });
  return triggers.length;
}

// Функция очистки всех триггеров
function cleanupAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`Cleaning up ${triggers.length} triggers`);
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    Logger.log(`Deleted trigger: ${trigger.getHandlerFunction()} - ${trigger.getUniqueId()}`);
  });
}

// Функция удаления триггеров processBatch
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`Checking ${triggers.length} triggers for deletion`);
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processBatch') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`Deleted processBatch trigger: ${trigger.getUniqueId()}`);
    }
  });
}

// Функция обработки одной партии данных
function processBatch() {
  Logger.log("processBatch started");
  const startTime = Date.now();
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.log);
    Logger.log("Got access to sheets");

    // Загружаем текущее состояние
    const state = ProcessingState.load();
    Logger.log(`Current state: batch ${state.currentBatch}, total areas: ${state.totalAreas}, listings: ${state.listings.length}`);

    // Получаем список областей
    const areaList = CONFIG.sheetNames.areas.reduce((acc, sheetName) => {
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

    Logger.log(`Total areas available: ${areaList.length}`);

    // Определяем текущую партию
    const startIndex = state.currentBatch * CONFIG.processing.batchSize;
    const endIndex = Math.min(startIndex + CONFIG.processing.batchSize, areaList.length);
    const currentBatch = areaList.slice(startIndex, endIndex);

    Logger.log(`Processing batch ${state.currentBatch + 1}: ${currentBatch.length} areas`);

    // Обрабатываем текущую партию
    for (const area of currentBatch) {
      Logger.log(`Processing area: ${area.name}`);
      
      if (Date.now() - startTime > CONFIG.processing.maxRunTime) {
        Logger.log("Time limit approaching, saving progress");
        break;
      }

      try {
        Utilities.sleep(Utils.getRandomDelay());
        const listings = fetchAreaListings(area);
        state.listings.push(...listings);
        
        Logger.log(`Successfully processed ${area.name}: ${listings.length} listings`);
      } catch (error) {
        Logger.log(`Error processing ${area.name}: ${error}`);
        continue;
      }
    }

    // Сохраняем прогресс
    state.currentBatch++;
    ProcessingState.save(state.currentBatch, state.totalAreas, state.listings);
    Logger.log(`Progress saved: batch ${state.currentBatch} of ${Math.ceil(state.totalAreas / CONFIG.processing.batchSize)}`);

    // Проверяем необходимость продолжения
    if (state.currentBatch * CONFIG.processing.batchSize < state.totalAreas) {
      Logger.log("Creating trigger for next batch");
      ScriptApp.newTrigger('processBatch')
        .timeBased()
        .after(60000)
        .create();
      
      Utils.updateLog(
        logSheet,
        "D",
        "In Progress",
        `Обработано ${state.currentBatch * CONFIG.processing.batchSize} из ${state.totalAreas} локаций`
      );
    } else {
      Logger.log("Processing completed, saving final results");
      saveResults(state.listings);
      ProcessingState.clear();
      
      Utils.updateLog(
        logSheet,
        "D",
        "Success",
        `Обработка завершена. Получено ${state.listings.length} объявлений`
      );
    }

  } catch (error) {
    Logger.log(`Error in processBatch: ${error}`);
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetNames.log);
    Utils.updateLog(logSheet, "D", "Error", error.toString());
  }

  // Удаляем текущий триггер
  deleteTriggers();
  Logger.log("processBatch completed");
}

// Вспомогательная функция для получения объявлений одной области
function fetchAreaListings(area) {
  const response = UrlFetchApp.fetch(area.url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`HTTP ${response.getResponseCode()}`);
  }

  const html = response.getContentText();
  return parseListings(html, area);
}

// Функция парсинга листингов
function parseListings(html, area) {
  const regex = /<li data-testid="result-(\d+)"[^>]*>.*?<a href="([^"]+)"[^>]*>.*?data-tracking="srp_address".*?<p[^>]*>(.*?)<\/p>.*?data-tracking="srp_price".*?<p[^>]*>(.*?)<\/p>.*?data-tracking="srp_meta".*?<span>(.*?)<\/span>/gs;
  const matches = [...html.matchAll(regex)];
  
  return matches.map(match => {
    const [_, id, link, address, price, meta] = match;
    return [
      id,
      address.trim(),
      price.trim(),
      meta.trim(),
      `${CONFIG.urls.base}${link}`,
      area.id,
      area.name
    ];
  });
}

// Функция сохранения результатов
function saveResults(listings) {
  if (listings.length === 0) return;

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.share) || 
                     spreadsheet.insertSheet(CONFIG.sheetNames.share);

  outputSheet.clear();
  outputSheet.getRange(1, 1, 1, CONFIG.headers.sheets.share.length)
    .setValues([CONFIG.headers.sheets.share]);

  outputSheet.getRange(2, 1, listings.length, CONFIG.headers.sheets.share.length)
    .setValues(listings);
}

function checkCurrentState() {
  const state = ProcessingState.load();
  Logger.log("Current processing state:");
  Logger.log(`Current batch: ${state.currentBatch}`);
  Logger.log(`Total areas: ${state.totalAreas}`);
  Logger.log(`Current listings count: ${state.listings.length}`);
  return state;
}

function resumeProcessing() {
  Logger.log("Resuming processing from last saved state");
  processBatch(); // Запускаем обработку следующей партии
}

function processSingleArea() {
  const state = ProcessingState.load();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.log);

  try {
    // Получаем все области
    const areaList = CONFIG.sheetNames.areas.reduce((acc, sheetName) => {
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

    // Определяем следующую область для обработки
    const currentIndex = state.currentBatch * CONFIG.processing.batchSize;
    if (currentIndex >= areaList.length) {
      // Все области обработаны, сохраняем финальный результат
      saveResults(state.listings);
      ProcessingState.clear();
      
      Utils.updateLog(
        logSheet,
        "D",
        "Success",
        `Обработка завершена. Получено ${state.listings.length} объявлений`
      );
      return;
    }

    const area = areaList[currentIndex];
    Logger.log(`Processing single area: ${area.name}`);

    // Обрабатываем одну область
    try {
      Utilities.sleep(Utils.getRandomDelay());
      const listings = fetchAreaListings(area);
      state.listings.push(...listings);
      Logger.log(`Successfully processed ${area.name}: ${listings.length} listings`);
    } catch (error) {
      Logger.log(`Error processing ${area.name}: ${error}`);
    }

    // Увеличиваем счетчик обработанных областей
    state.currentBatch++;
    ProcessingState.save(state.currentBatch, state.totalAreas, state.listings);

    // Создаем триггер для следующей области
    ScriptApp.newTrigger('processSingleArea')
      .timeBased()
      .after(60000) // 1 минута
      .create();

    Utils.updateLog(
      logSheet,
      "D",
      "In Progress",
      `Обработано ${state.currentBatch} из ${state.totalAreas} локаций. Собрано ${state.listings.length} объявлений`
    );

  } catch (error) {
    Logger.log(`Error in processSingleArea: ${error}`);
    Utils.updateLog(logSheet, "D", "Error", error.toString());
  }
}

// Функция для безопасного запуска обработки оставшихся областей
function resumeFromCurrent() {
  // Очищаем существующие триггеры
  cleanupAllTriggers();
  
  // Запускаем обработку следующей области
  processSingleArea();
}

function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`Current triggers count: ${triggers.length}`);
  triggers.forEach(trigger => {
    Logger.log(`Trigger: ${trigger.getHandlerFunction()} - ${trigger.getUniqueId()}`);
  });
  return triggers.length;
}

function processRemainingAreas() {
  Logger.log("Starting processing of remaining areas");
  
  const targetAreas = ["Spiddal", "Moycullen"];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.log);
  const shareSheet = spreadsheet.getSheetByName(CONFIG.sheetNames.share);
  
  // Получаем текущие данные с листа Share
  const currentData = shareSheet ? shareSheet.getDataRange().getValues() : [];
  const headers = currentData[0];
  const existingListings = currentData.slice(1);
  
  Logger.log(`Current listings count: ${existingListings.length}`);
  
  // Собираем информацию о целевых локациях
  const areas = [];
  CONFIG.sheetNames.areas.forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const areaData = data.slice(1)
      .filter(row => row[3] && targetAreas.includes(row[1]))
      .map(([areaID, areaName, , shareUrl]) => ({
        id: areaID,
        name: areaName,
        url: shareUrl
      }));
    
    areas.push(...areaData);
  });
  
  Logger.log(`Found ${areas.length} remaining areas to process`);
  
  // Обрабатываем оставшиеся локации
  const newListings = [];
  for (const area of areas) {
    Logger.log(`Processing area: ${area.name}`);
    try {
      Utilities.sleep(Utils.getRandomDelay());
      const listings = fetchAreaListings(area);
      newListings.push(...listings);
      Logger.log(`Successfully processed ${area.name}: ${listings.length} listings`);
    } catch (error) {
      Logger.log(`Error processing ${area.name}: ${error}`);
    }
  }
  
  Logger.log(`Got ${newListings.length} new listings`);
  
  // Обновляем лист Share
  if (newListings.length > 0) {
    const allListings = [...existingListings, ...newListings];
    shareSheet.clear();
    shareSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    shareSheet.getRange(2, 1, allListings.length, headers.length).setValues(allListings);
    
    Utils.updateLog(
      logSheet,
      "D",
      "Success",
      `Обработка завершена. Получено ${allListings.length} объявлений`
    );
  }
  
  Logger.log("Processing of remaining areas completed");
}
