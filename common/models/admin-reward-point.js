'use strict';

let async = require('async');


module.exports = function(AdminRewardPoint) {

  AdminRewardPoint.validatesPresenceOf('key', 'displayName', 'point');
  AdminRewardPoint.validatesUniquenessOf('key', 'displayName');

  /*
  * convert the key value to uppercase and replaces spaces with _
  */

  AdminRewardPoint.observe('before save',(ctx, next) => {
    if(ctx.instance.key){
      ctx.instance.key = ctx.instance.key.toUpperCase().replace(' ', '_');
    }
    next();
  });

  AdminRewardPoint.remoteMethod('getAllRewards', {
    description: 'To get all rewards and their points',
    accepts: [
      {arg: 'ctx', type: 'object', http: {source: 'context'}},
    ],
    http: {path: '/all-rewards', verb: 'get'},
    returns: {arg: 'data', type: 'object', root: true}
  });

  /**
   * To get all the rewards for admin with pagination enabled
   *
   * @param  {ctx} context [http context]
   * @return {getAllRewardsCB} callback
   * @author Johnson T
   */

  AdminRewardPoint.getAllRewards = (ctx, getAllRewardsCB) => {
    async.waterfall(
      [
        async.apply(fetchAllRewardByLimit, ctx),
        getAllRewardCount
      ],
      (waterfallErr, data) => {
        if (waterfallErr) {
          return getAllRewardsCB(waterfallErr);
        }
        getAllRewardsCB(waterfallErr, data);
      }
    );
  }

  /**
   * To get the rewards either by limit and skip or full rewards list
   *
   * @param  {ctx} params context [http context]
   * @return {function} fetchAllRewardByLimitCB [callback]
   * @author Johnson T
   */

  const fetchAllRewardByLimit = (ctx, fetchAllRewardByLimitCB) => {
    var query = {};
    if (ctx.req.query && ctx.req.query.filter){
      query = {
        limit: ctx.req.query.filter.limit ? ctx.req.query.filter.limit : 0,
        skip: ctx.req.query.filter.skip ? ctx.req.query.filter.skip : 0
      }
    }
    AdminRewardPoint.find(query, (findErr, rewards) => {
      if (findErr) {
        return fetchAllRewardByLimitCB(findErr);
      }
      fetchAllRewardByLimitCB(findErr, rewards);
    });
  }

  /**
   * To get the total records count
   *
   * @param  {rewards} params 
   * @return {function} getRewardCountCB [callback]
   * @author Johnson T
   */

  const getAllRewardCount = (rewards, getRewardCountCB) => {
    AdminRewardPoint.find({}, (findErr, allRewards) => {
      if (findErr) {
        return getRewardCountCB(findErr);
      }
      getRewardCountCB(findErr, {records: rewards, paginationCount: allRewards.length});
    });
  }

};
// ex: http://localhost:3000/api/AdminRewardPoints/all/?filter[limit]=2&filter[skip]=1

// https://strongloop.com/strongblog/working-with-pagination-and-loopback/


  // AdminRewardPoint.beforeRemote('access', function(ctx, instance, cb){
  //   console.log("in before filter");
  //   if(!ctx.args.filter || !ctx.args.filter.limit) {
  // 		if(!ctx.args.filter) ctx.args.filter = {};
  // 		ctx.args.filter.limit = 10;
  // 	}
  // 	cb();
  // })
