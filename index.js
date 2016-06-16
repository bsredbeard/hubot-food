// Description:
//   Makes ordering food as a group easier!
//
// Dependencies:
//   rsvp
//
// Configuration:
//   none
//
// Commands:
//   hubot food start "{order name}"[ from {some restaurant}] - start a food order
//   hubot food for "{order name}" get me {your order} - add or modify your order
//   hubot food check "{order name}" - prints out the current order list
//   hubot food end "{order name}" - prints out the current order list and stops taking orders
//
// Notes:
//   Hubot is grumpy, cram some food in its intake port.
//
// Tags:
//   food
//
// Examples:
//   hubot food start order "lunch" from the sub shop
//   hubot food for order "lunch" get me a BLT
//   hubot food check "lunch"
//   hubot food end "lunch"
//
// Author:
//   mentalspike
'use strict';
var Promise = require('rsvp').Promise;

var trim = function trim(str) {
  if (str && typeof str === 'string') {
    return str.replace(/^\s*(.*?)\s*$/, '$1');
  }
  return str;
};

var BRAIN_KEY = 'foodbot.orders';

function foodBot(robot) {

  function OrderManager(){
    var orders = robot.brain.get(BRAIN_KEY) || {};
    var hasOrder = function hasOrder(orderName) {
      return orders.hasOwnProperty(orderName);
    };
    var startOrder = function startOrder(orderName, restaurant) {
      if (hasOrder(orderName)) {
        return false;
      }
      var data = {};
      if (restaurant) {
        data[' restaurant'] = restaurant;
      }
      orders[orderName] = Promise.resolve(data);
      return true;
    };
    var setEntry = function setEntry(orderName, user, entry) {
      if (hasOrder(orderName)) {
        orders[orderName] = orders[orderName].then(function (order) {
          order[user] = entry;
          return order;
        });
        return true;
      }
      return false;
    };
    var peek = function peek(orderName, cb) {
      if (hasOrder(orderName)) {
        orders[orderName].then(function (order) {
          var result = [];
          for (var key in order) {
            result.push('' + trim(key) + ': ' + order[key]);
          }
          cb(result);
        });
        return true;
      }
      return false;
    };
    var endOrdering = function endOrdering(orderName) {
      if (hasOrder(orderName)) {
        delete orders[orderName];
      }
    };
    var save = function save(){
      robot.brain.set(BRAIN_KEY, orders);
    };
    var getOrderNames = function getOrderNames(){
      var orderNames = [];
      for(var jk in orders){
        orderNames.push(jk);
      }
      orderNames.sort();
      return orderNames;
    };
    this.hasOrder = hasOrder;
    this.startOrder = startOrder;
    this.setEntry = setEntry;
    this.peek = peek;
    this.endOrdering = endOrdering;
    this.save = save;
    this.getOrderNames = getOrderNames;
  }


  robot.respond('/food help/i', function (res) {
    var foodCommands = [];
    if(robot.helpCommands){
      //robot knows about help commands, rely on the help documentation
      var cmds = robot.helpCommands();
      for(var jk in cmds){
        if(/food (start|check|end|for)/.test(cmds[jk])){
          foodCommands.push('  ' + cmds[jk]);
        }
      }
      foodCommands.reverse();
    } 
    if(foodCommands.length) {
      res.send('Help track a food order with the following commands:\r\n' + foodCommands.join('\r\n'));
    } else {
      //robot does not know about the food commands
      res.send([
        'Help track a food order with the following commands:',
        '  Start an order: @' + robot.name + ' food start "{order name}"[ from {some restaurant}]',
        '  Add/change your request: @' + robot.name + ' food for "{order name}" get me [your request]',
        '  Check the order requests: @' + robot.name + ' food check "{order name}"',
        '  Finish ordering and get the final list: @' + robot.name + ' food end "{order name}"'
      ].join('\r\n'));
    }
  });

  robot.respond(/food start "([^"]+)"(?: from (.+))?/i, function (res) {
    var orderName = res.match[1];
    var restaurant = res.match[2];
    if (orderName) {
      var manager = new OrderManager();
      if (manager.startOrder(orderName, restaurant)) {
        manager.save();
        res.send('Hey, @here! I\'m taking orders for "' + orderName + '". Add your order with `@' + robot.name + ' food for "' + orderName + '" get me [something tasty]`');
      } else {
        res.reply('I\'m already tracking an order by that name.');
      }
    } else {
      res.reply('I didn\'t see an order name. Try `@' + robot.name + ' start "{order name}"`');
    }
  });
  robot.respond(/food for "([^"]+)" get me[\s]+(.*)/i, function (res) {
    var user = res.message.user.name;
    var orderName = res.match[1];
    var orderText = res.match[2];
    if (user && orderName && orderText) {
      var manager = new OrderManager();
      if (manager.hasOrder(orderName)) {
        if (manager.setEntry(orderName, user, orderText)) {
          manager.save();
          res.reply('I got your order!');
        } else {
          res.reply('Weird, I couldn\'t store your order.');
        }
      } else {
        res.reply('Sorry, I\'m not taking orders for "' + orderName + '" right now.');
      }
    } else {
      res.reply('I don\'t understand your order request');
    }
  });
  robot.respond(/food check(?: "([^"]+)")?/i, function (res) {
    var orderName = res.match[1];
    var manager = new OrderManager();
    if(orderName){
      if (manager.hasOrder(orderName)) {
        var didPeek = manager.peek(orderName, function (entries) {
          res.send('The current list of orders for "' + orderName + '" is:\r\n' + entries.join('\r\n'));
        });
        if (!didPeek) {
          res.reply('I seem to be having some problems listing order "' + orderName + '".');
        }
      } else {
        res.reply('I am not tracking an order by the name: ' + orderName);
      }
    } else {
      var activeOrders = manager.getOrderNames();
      if(activeOrders.length){
        res.reply('Current food orders:\r\n  ' + activeOrders.join('\r\n  '));
      } else {
        res.reply('I\'m not currently tracking any orders.');
      }
    }
  });
  robot.respond(/food end "([^"]+)"/i, function (res) {
    var orderName = res.match[1];
    var manager = new OrderManager();
    if (manager.hasOrder(orderName)) {
      var didPeek = manager.peek(orderName, function (entries) {
        res.send('The list of orders for "' + orderName + '" is:\r\n' + entries.join('\r\n'));
        manager.endOrdering(orderName);
        manager.save();
        res.send('The order for "' + orderName + '" is now closed.');
      });
      if (!didPeek) {
        res.reply('I seem to be having some problems listing order "' + orderName + '".');
      }
    } else {
      res.reply('I am not tracking an order by the name: ' + orderName);
    }
  });
}

module.exports = foodBot;
