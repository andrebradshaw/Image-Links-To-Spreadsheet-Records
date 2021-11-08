function doGet(e) { //this function serves up the view HTML file 
  return HtmlService.createTemplateFromFile('view')
                    .evaluate()
                    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}

function processUploadedFileFromClient(url){
  return getDataBlob(url);
}
const cleanObject = (ob) => 
  Object.entries(ob).reduce((r, [k, v]) => {
      if(v != null && v != undefined && v != "" && ( typeof v == 'boolean' || typeof v == 'string' || typeof v == 'symbol' || typeof v == 'number' || typeof v == 'function' || (typeof v == 'object'  && ((Array.isArray(v) && v.length) || (Array.isArray(v) != true)) ) ) ) { 
      r[k] = v; 
      return r;
      } else { 
      return r; 
      }
  }, {});
function fileImageBlob(blob,headers){
  if(headers){
    var file = {
      title: 'OCR File',
      mimeType: headers['Content-Type']
    };
    file = Drive.Files.insert(file, blob, {ocr: true});
    var doc = DocumentApp.openByUrl(file.embedLink);
    var body = doc.getBody().getText();//.replace(/\n/g,'<br>');
    deleteFileById(file.getId()); 
    var processed = extractContactDetails(body);
    var merged = {...processed,...{last_modified: headers['Last-Modified']}};
    console.log(merged);
    return merged;
  }else{
    return 'file type not supported';
  }
}
function deleteFileById(id){
  var file = DriveApp.getFileById(id);
  file.setTrashed(true);
}
function extractContactDetails(s){
  return cleanObject({
    email:/\b[\w\.\-\+]+@[\w\-]+\.[a-zA-Z]{2,13}(\.[a-zA-Z]{2,13}|\b)/i.exec(s?.replace(/[\n\r]+/g,' '))?.[0],
    phone:/\b[2-9]\d{2}\){0,1}\W{0,1}\d{3}\W{0,1}\d{4}\b/i.exec(s?.replace(/[\n\r]+/g,' '))?.[0] || /\b[2-9]\d{2}\D{0,2}\s{0,1}\W{0,1}\s{0,1}\d{3}\s{0,1}\W{0,2}\s{0,1}\d{4}\b/i.exec(s?.replace(/[\n\r]+/g,' '))?.[0],
    first_line: /(.+)\n/.exec(s?.trim())?.[1],
    second_line:/\n(.+)/.exec(s?.trim())?.[1],
    raw_text:s,
  })
}
function getDataBlob(url){
  var res = UrlFetchApp.fetch(url);
  var blob = res.getBlob();
  var res_headers = res.getHeaders();
  return fileImageBlob(blob,res_headers);
}
