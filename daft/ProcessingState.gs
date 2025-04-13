// Новый файл для управления состоянием обработки
const ProcessingState = {
  setup() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let stateSheet = spreadsheet.getSheetByName(CONFIG.processing.stateSheet);
    
    if (!stateSheet) {
      stateSheet = spreadsheet.insertSheet(CONFIG.processing.stateSheet);
      stateSheet.getRange("A1:C1").setValues([["CurrentBatch", "TotalAreas", "Listings"]]);
      stateSheet.getRange("A2:C2").setValues([[0, 0, "[]"]]);
    }
    return stateSheet;
  },

  save(batch, total, listings) {
    const stateSheet = this.setup();
    stateSheet.getRange("A2:C2").setValues([[
      batch,
      total,
      JSON.stringify(listings)
    ]]);
  },

  load() {
    const stateSheet = this.setup();
    const [batch, total, listingsJson] = stateSheet.getRange("A2:C2").getValues()[0];
    return {
      currentBatch: parseInt(batch),
      totalAreas: parseInt(total),
      listings: JSON.parse(listingsJson)
    };
  },

  clear() {
    const stateSheet = this.setup();
    stateSheet.getRange("A2:C2").setValues([[0, 0, "[]"]]);
  }
};
