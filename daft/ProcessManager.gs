/**
 * @fileoverview Менеджер процесса обработки
 * Управляет процессом парсинга и обработки данных
 * @lastmod 2025-04-22
 */

class ProcessManager {
  /**
   * Этап 1: Сбор сырых данных
   */
  static async collectRawData() {
    Logger.logProgress("Starting", "Начало сбора сырых данных");

    try {
      // Сбор сырых данных
      await DataProcessor.fetchAndSaveRawData();

      // Устанавливаем триггер для запуска второго этапа
      try {
        ScriptApp.newTrigger("processListings")
          .timeBased()
          .after(1 * 60 * 1000) // Запуск через 1 минуту
          .create();
        Logger.logProgress("Success", "Сырые данные собраны. Установлен триггер для обработки объявлений.");
      } catch (error) {
        Logger.logError(error, "Ошибка создания триггера");
      }
    } catch (error) {
      Logger.logError(error, "Ошибка в collectRawData");
    }
  }

/**
 * Этап 2: Обработка объявлений
 */
static async processListings() {
  Logger.logProgress("Starting", "Начало обработки объявлений");

  try {
    Logger.logProgress("Info", "Удаление триггера...");
    this.clearCurrentTrigger();

    Logger.logProgress("Info", "Получение списка локаций...");
    const areas = SheetManager.getAllAreas();
    Logger.logProgress("Info", `Найдено ${areas.length} локаций.`);

    if (areas.length === 0) {
      throw new Error("No areas found for processing");
    }

    const allListings = [];
    for (const area of areas) {
      Logger.logProgress("Info", `Обработка локации: ${area.name}`);
      await Utilities.sleep(this.getRandomDelay());
      const listings = await DataProcessor.fetchListings(area);
      allListings.push(...listings);

      // Заменяем logDebug на logProgress
      Logger.logProgress("Info", `Processed ${area.name}: ${listings.length} listings`);
    }

    Logger.logProgress("Info", "Сохранение обработанных данных...");
    SheetManager.saveListings(allListings);

    Logger.logProgress("Success", `Обработка завершена. Получено ${allListings.length} объявлений`);
  } catch (error) {
    Logger.logError(error, "Ошибка в processListings");
  }
}

  /**
   * Удаляет текущий триггер для предотвращения повторного запуска
   */
  static clearCurrentTrigger() {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === "processListings") {
        ScriptApp.deleteTrigger(trigger);
      }
    }
  }

  /**
   * Возвращает случайную задержку
   * @return {number} Задержка в миллисекундах
   */
  static getRandomDelay() {
    const { min, max } = CONFIG.execution.delays;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

/**
 * Глобальная функция для запуска сбора сырых данных
 */
function runCollectRawData() {
  ProcessManager.collectRawData();
}

/** Добавьте глобальную функцию для вызова processListings */

function runProcessListings() {
  ProcessManager.processListings();
}
