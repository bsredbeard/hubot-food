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

var orders = {};
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

function foodBot(robot) {
  robot.respond('/food help/i', function (res) {
    res.send(['Help track a food order with the following commands:', '  Start an order: @' + robot.name + ' food start "{order name}"[ from {some restaurant}]', '  Add/change your request: @' + robot.name + ' food for "{order name}" get me [your request]', '  Check the order requests: @' + robot.name + ' check "{order name}"', '  Finish ordering and get the final list: @' + robot.name + ' end "{order name}"'].join('\r\n'));
  });

  robot.respond(/food start "([^"]+)"(?: from (.+))?/i, function (res) {
    var orderName = res.match[1];
    var restaurant = res.match[2];
    if (orderName) {
      if (startOrder(orderName, restaurant)) {
        res.send('Hey, @all! I\'m taking orders for "' + orderName + '". Add your order with `@' + robot.name + ' food for "' + orderName + '" get me [something tasty]`');
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
      if (hasOrder(orderName)) {
        if (setEntry(orderName, user, orderText)) {
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
  robot.respond(/food check "([^"]+)"/i, function (res) {
    var orderName = res.match[1];
    if (hasOrder(orderName)) {
      var didPeek = peek(orderName, function (entries) {
        res.send('The current list of orders for "' + orderName + '" is:\r\n' + entries.join('\r\n'));
      });
      if (!didPeek) {
        res.reply('I seem to be having some problems listing order "' + orderName + '".');
      }
    } else {
      res.reply('I am not tracking an order by the name: ' + orderName);
    }
  });
  robot.respond(/food end "([^"]+)"/i, function (res) {
    var orderName = res.match[1];
    if (hasOrder(orderName)) {
      var didPeek = peek(orderName, function (entries) {
        res.send('The list of orders for "' + orderName + '" is:\r\n' + entries.join('\r\n'));
        endOrdering(orderName);
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
