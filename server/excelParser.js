'use strict';

let async = require('async');
var XLSX = require('xlsx');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var multer = require('multer');

/*
* Reference Links
* https://www.npmjs.com/package/xlsx
* https://ciphertrick.com/2016/06/05/read-excel-files-convert-json-node-js/
* https://github.com/SheetJS/js-xlsx/issues/159  this for csv parser
* https://github.com/SheetJS/js-xlsx/issues/163  this for csv generator
*
* Dependencies:
* async, loadsh, fs, multer[file upload manager], xlsx[excel file generator and parser]
*/


var files;
var jsonData=[];

/**
 * Validates the imported file
 * @param  {headers} file headers for the excel
 * @param  {req}
 * @param  {res}
 * @return {validateImportedFileCB} callback
 * @author Johnson T
 *
 */

const validateImportedFile = (headers, req, res, validateImportedFileCB) => {
  try {
    var storage = multer.diskStorage({ //multers disk storage settings
      destination: function (req, file, cb) {
        cb(null, './assets/uploads/')
      },
      filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
      }
    });

    var upload = multer({
      storage: storage,
      fileFilter : function(req, file, callback) { //file filter
        if(['xls','xlsx','csv'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
          return callback(new Error('upload only xls or xlsx or csv files.'));
        }
        callback(null, true);
      }
    }).any();

    upload(req, res, function(err){
      files = req.files;
      if (err) {
        return validateImportedFileCB(err, null);
      }

      if (!files.length) {
        return validateImportedFileCB("File upload Failed, Please try again!")
      }
      validateImportedFileCB(null, files, headers)
    });
  } catch (e) {
    console.log(e);
    return validateImportedFileCB("Something went wrong !")
  }
}

/**
 * Parses the imported file
 * @param  {files} imported file
 * @return {parseImportedFileCB} callback
 * @author Johnson T
 *
 */

const parseImportedFile = (files, headers, parseImportedFileCB) => {
  try {
    var workbook = XLSX.readFile(files[0].path);

    var name = workbook.SheetNames[0]
    var sheet = workbook.Sheets[name];
    jsonData = XLSX.utils.sheet_to_json(sheet);

    if(!jsonData.length){
      return parseImportedFileCB("Something wrong with the uploaded file...", null)
    }
    parseImportedFileCB(null, jsonData, headers)
  } catch (e) {
    console.log(e);
    return parseImportedFileCB("Something went wrong")
  }
}

/**
 * Checks whether the uploaded csv header and schema header are valid
 * @param  {jsonData} data parsed from csv
 * @return {checkHeaderFormatCB} callback
 * @author Johnson T
 */

const checkHeaderFormat = (jsonData, headers, checkHeaderFormatCB) => {
  try {
    var fileHeaders = [];
    _.mapKeys(jsonData[0], function(value, key){
      fileHeaders.push(key)
    });
    if(_.isEqual(headers, fileHeaders)) {
      fs.unlink(files[0].path, function(error) {
        if (error) {
          return checkHeaderFormatCB(error);
        }
        return checkHeaderFormatCB(null, jsonData)
      });
    }else{
      return checkHeaderFormatCB("Uploaded file header don't match the requirement", null)
    }
  } catch (e) {
    console.log(e);
    checkHeaderFormatCB("Something went wrong !", null)
  }
}

// excelParser(headers, req, res);

/**
 * @param  {headers} file headers for the excel
 * @param  {req}
 * @param  {res}
 * @return {excelParserCB} callback
 * @author Johnson T
 *
*/

exports.parse = function(headers, req, res, excelParserCB) {
  async.waterfall(
    [
      async.apply(validateImportedFile, headers, req, res),
      parseImportedFile,
      checkHeaderFormat
    ],
    (waterfallErr, data) => {
      if(waterfallErr){
        return excelParserCB(waterfallErr);
      }
      return excelParserCB(null, data);
    }
  )
};


// make sure the fileName to be uniq of any other files in the application.

/**
 * @param  {headers} file headers for the excel
 * @param  {fileName} filename for the excel
 * @param  {req}
 * @param  {res}
 * @return {downloadExcelCB} callback
 * @author Johnson T
 *
*/

exports.downloadExcel = function(headers, fileName, req, res, downloadExcelCB) {
  try {

    var sheets = {}
    sheets[fileName] = XLSX.utils.aoa_to_sheet([headers])
    var data = {SheetNames: [fileName], Sheets: sheets};

    XLSX.writeFile(data, fileName+".csv"); // save to test.xlsx

    var datetime = new Date();

    res.set('Last-Modified', datetime +'GMT');
    res.set('Content-Type','application/force-download');
    res.set('Content-Type','application/octet-stream');
    res.set('Content-Type','application/download');
    res.set('Content-Disposition','attachment;filename='+fileName+'.csv');
    res.set('Content-Transfer-Encoding','binary');
    res.sendFile(path.resolve('./'+fileName+'.csv'), (err) => {
      if(err){
        return downloadExcelCB(err);
      }
      fs.unlink('./'+fileName+'.csv', function(error) {
        if (error) {
          return downloadExcelCB(error);
        }
      });
      return downloadExcelCB(null, path.resolve('./'+fileName+'.csv'));
    });

  } catch (e) {
    console.log(e);
    downloadExcelCB("Something went wrong !");
  }
}
