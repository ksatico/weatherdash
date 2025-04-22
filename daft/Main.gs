/**
 * @fileoverview Основной файл с точкой входа
 * Предоставляет ручные стартовые функции для запуска этапов обработки
 * @lastmod 2025-04-22
 */

/**
 * Точка входа для запуска первого этапа (сбор сырых данных)
 */
function startRawDataCollection() {
  ProcessManager.collectRawData();
}

/**
 * Точка входа для запуска второго этапа (обработка объявлений)
 * Используется, если нужно перезапустить второй этап вручную
 */
function startListingsProcessing() {
  ProcessManager.processListings();
}
