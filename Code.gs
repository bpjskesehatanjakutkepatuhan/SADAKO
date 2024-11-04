var SPREADSHEET_ID = "1UkRK9J8SC_xWWiLM0Of5boqLZ_Ge7HW4QeXREYVTdP8"; // Ganti dengan ID spreadsheet Anda
var SHEET_NAME = "Data"; // Nama sheet untuk menyimpan data

function doPost(e) {
  try {
    // Log untuk memeriksa parameter yang diterima
    Logger.log("Parameter yang diterima: " + JSON.stringify(e.parameters));

    var namabu = e.parameter.namabu || "";
    var kodebu = e.parameter.kodebu || "";
    var email = e.parameter.email || "";
    var kontak = e.parameter.kontak || "";
    var ro = e.parameter.ro || "";
    var keterangan = e.parameter.keterangan || "";

    // Cek apakah file content tersedia
    if (!e.parameter.fileContent || !e.parameter.filename) {
      throw new Error("File tidak tersedia atau parameter fileContent tidak valid.");
    }

    // Upload file dan dapatkan URL
    var fileUrl = uploadFileToGoogleDrive(e.parameter.fileContent, e.parameter.filename);

    // Simpan data ke spreadsheet
    recordData(e, fileUrl);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Data berhasil disimpan!" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error pada doPost: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function recordData(e, fileUrl) {
  try {
    var doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = doc.getSheetByName(SHEET_NAME);

    // Urutan header sesuai urutan kolom di spreadsheet
    var headers = ["Timestamp", "namabu", "kodebu", "email", "kontak", "ro", "keterangan", "file"];
    var nextRow = sheet.getLastRow() + 1;

    // Susun array `row` sesuai urutan header
    var row = [new Date()]; // Timestamp awal

    headers.slice(1).forEach(function(header) { // Mulai dari index 1 untuk Timestamp
      if (header === "file") {
        row.push(fileUrl);
      } else {
        row.push(e.parameter[header] || "");
      }
    });

    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

  } catch (error) {
    Logger.log("Error pada recordData: " + error.toString());
    throw new Error("Gagal menyimpan data ke spreadsheet.");
  }
}

function uploadFileToGoogleDrive(data, filename) {
  try {
    var folderName = "SADAKO";
    var folder = getOrCreateFolder(folderName);

    var contentType = data.substring(5, data.indexOf(';'));
    var bytes = Utilities.base64Decode(data.split(',')[1]);
    var blob = Utilities.newBlob(bytes, contentType, filename);
    
    var file = folder.createFile(blob);
    return file.getUrl();

  } catch (error) {
    Logger.log("Error pada uploadFileToGoogleDrive: " + error.toString());
    throw new Error("Gagal mengunggah file ke Google Drive.");
  }
}

function test_doPost() {
  var testData = {
    parameter: {
      namabu: "Nama Perusahaan Test",
      kodebu: "123456",
      email: "test@example.com",
      kontak: "08123456789",
      ro: "Fajar",
      keterangan: "Ini keterangan test",
      fileContent: "data:application/pdf;base64,JVBERi0xLjcKJc...",
      filename: "test.pdf"
    }
  };

  // Panggil fungsi doPost dengan data simulasi
  var result = doPost(testData);
  Logger.log(result.getContent()); // Lihat hasil JSON pada log
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}
