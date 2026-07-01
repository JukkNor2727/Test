const CONFIG = {
  spreadsheetName: 'Drive Data Website Database',
  sheetName: 'records',
  headers: ['id', 'title', 'category', 'owner', 'status', 'description', 'createdAt', 'updatedAt']
};

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || 'list';
  let payload;

  try {
    if (action === 'list') {
      payload = {
        ok: true,
        records: listRecords()
      };
    } else if (action === 'stats') {
      payload = {
        ok: true,
        stats: getStats()
      };
    } else {
      payload = {
        ok: false,
        message: 'Unknown action'
      };
    }
  } catch (error) {
    payload = {
      ok: false,
      message: error.message
    };
  }

  return createOutput(payload, params.callback);
}

function doPost(e) {
  const params = e.parameter || {};
  const action = params.action || 'create';
  let payload;

  try {
    if (action === 'create') {
      const record = createRecord(params);
      payload = {
        ok: true,
        record
      };
    } else {
      payload = {
        ok: false,
        message: 'Unknown action'
      };
    }
  } catch (error) {
    payload = {
      ok: false,
      message: error.message
    };
  }

  return createOutput(payload, params.callback);
}

function createRecord(params) {
  validateRequired(params.title, 'title');
  validateRequired(params.category, 'category');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const now = new Date().toISOString();
    const record = {
      id: Utilities.getUuid(),
      title: cleanText(params.title, 120),
      category: cleanText(params.category, 80),
      owner: cleanText(params.owner || '', 80),
      status: cleanText(params.status || 'ใหม่', 50),
      description: cleanText(params.description || '', 1000),
      createdAt: now,
      updatedAt: now
    };

    sheet.appendRow(CONFIG.headers.map((key) => record[key]));
    return record;
  } finally {
    lock.releaseLock();
  }
}

function listRecords() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = normalizeCell(row[index]);
      });
      return item;
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function getStats() {
  const records = listRecords();
  const categories = {};

  records.forEach((record) => {
    const category = record.category || 'ไม่ระบุ';
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    total: records.length,
    categories,
    latestUpdatedAt: records.length ? records[0].updatedAt : null
  };
}

function getSheet() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.spreadsheetName);
    properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
  }

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, CONFIG.headers.length).getValues()[0];
  const needsHeaders = CONFIG.headers.some((header, index) => firstRow[index] !== header);

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, CONFIG.headers.length).setValues([CONFIG.headers]);
    sheet.setFrozenRows(1);
  }
}

function createOutput(payload, callback) {
  const json = JSON.stringify(payload);

  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function validateRequired(value, fieldName) {
  if (!String(value || '').trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value === undefined || value === null ? '' : value;
}
