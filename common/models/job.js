'use strict';

let async = require('async');

const excelParser = require('../../server/excelParser');

module.exports = function(Job) {

  Job.validatesPresenceOf('title', 'location', 'company', 'requirement', 'experience');

  /* pre-required variables */

  var headers = ['title', 'company', 'location', 'heroDescription', 'salary', 'companySize', 'requirement', 'experience', 'education', 'jobDescription', 'aboutCompany'];

  /* Remote method to create jobs from imported excel sheet */

  Job.remoteMethod('createJobs', {
    description: 'Creates job from the excel sheet',
    accepts: [
      {arg: 'req', type: 'object', http: { source: 'req' } },
      {arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: {path: '/create-jobs', verb: 'post'},
    returns: {arg: 'data', type: 'object', root: true}
  });

  /**
   * To create jobs from excel
   * @param  {req}
   * @param  {res}
   * @return {createJobsCB} callback
   * @author Johnson T
   */

  Job.createJobs = (req, res, createJobsCB) => {
    try {
      async.waterfall(
        [
          async.apply(getData, headers, req, res),
          generateRecords
        ],
        (waterfallErr, data) => {
          if(waterfallErr){
            return createJobsCB(waterfallErr)
          }
          createJobsCB(waterfallErr, data);
        }
      )
    }catch(e){
      console.log(e);
      createJobsCB("Something went wrong !", null);
    }
  }

  /**
   * Gets data as json object from the imported file using excelParser.
   * @param  {headers}
   * @param  {req}
   * @param  {res}
   * @return {validateImportedFileCB} callback
   * @author Johnson T
   *
  */

  const getData = (headers, req, res, getDataCB) => {
    try {
      excelParser.parse(headers, req, res, function(err, data){
        if (err){
          return getDataCB(err, null);
        }
        getDataCB(null, data);
      })
    }catch(e){
      console.log(e);
      getDataCB(e);
    }
  }

  /**
  * Creates the jobs from the uploaded excel
  * @param  {jsonData}
  * @return {generateRecordsCB} callback
  * @author Johnson T
  */

  const generateRecords = (jsonData, generateRecordsCB) => {
    jsonData.forEach(function(data){
      Job.create(data, (err, result) => {
        if (err) {
          return generateRecordsCB(err);
        }
      })
    })
    generateRecordsCB(null, jsonData);
  }


  /* Remote method to Download a template excel document */

  Job.remoteMethod('downloadExcelTemplate', {
    description: 'Download a template excel document',
    accepts: [
      {arg: 'req', type: 'object', http: { source: 'req' } },
      {arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: {path: '/excel-data-template', verb: 'get'},
    returns: {arg: 'data', type: 'object'}
  });


  /**
   * Validates the imported file
   * @param  {req}
   * @param  {res}
   * @return {downloadExcelTemplateCB} callback
   * @author Johnson T
   *
  */

  Job.downloadExcelTemplate = (req, res, downloadExcelTemplateCB) => {
    try {
      excelParser.downloadExcel(headers, 'jobsSheet', req, res, function(err, data){
        if (err){
          return downloadExcelTemplateCB(err, null);
        }
        // downloadExcelTemplateCB(null, data)
      });
    } catch (e) {
      console.log(e);
      downloadExcelTemplateCB("Something went wrong !");
    }
  }

};
