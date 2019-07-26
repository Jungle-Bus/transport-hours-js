(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TransportHours = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
};

},{}],2:[function(require,module,exports){
"use strict";function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}var OpeningHours=function(){function a(b){if(_classCallCheck(this,a),this.openingHours={},this._parse(b),Object.values(this.openingHours).filter(function(a){return 0===a.length}).length===Object.keys(this.openingHours).length)throw new Error("Can't parse opening_hours : "+b)}return _createClass(a,[{key:"getTable",value:function getTable(){return this.openingHours}},{key:"_parse",value:function _parse(a){var b=this;this._initOpeningHoursObj(),a=this._simplify(a);var c=this._splitHard(a);c.forEach(function(a){b._parseHardPart(a)})}},{key:"_simplify",value:function _simplify(a){return"24/7"==a&&(a="mo-su 00:00-24:00; ph 00:00-24:00"),a=a.toLocaleLowerCase(),a=a.trim(),a=a.replace(/ +(?= )/g,""),a=a.replace(" -","-"),a=a.replace("- ","-"),a=a.replace(" :",":"),a=a.replace(": ",":"),a=a.replace(" ,",","),a=a.replace(", ",","),a=a.replace(" ;",";"),a=a.replace("; ",";"),a}},{key:"_splitHard",value:function _splitHard(a){return a.split(";")}},{key:"_parseHardPart",value:function _parseHardPart(a){var b=this;"24/7"==a&&(a="mo-su 00:00-24:00");var c=a.split(/\ |\,/),d={},e=[],f=[];for(var g in c.forEach(function(a,c){b._checkDay(a)&&(0===f.length?e=e.concat(b._parseDays(a)):(e.forEach(function(a){d[a]=d[a]?d[a].concat(f):f}),e=b._parseDays(a),f=[])),b._checkTime(a)&&(0===c&&0===e.length&&(e=b._parseDays("Mo-Su,PH")),"off"==a?f=[]:f.push(b._cleanTime(a)))}),e.forEach(function(a){d[a]=d[a]?d[a].concat(f):f}),0<e.length&&0===f.length&&e.forEach(function(a){d[a]=["00:00-24:00"]}),d)this.openingHours[g]=d[g]}},{key:"_parseDays",value:function _parseDays(a){var b=this;a=a.toLowerCase();var c=[],d=a.split(",");return d.forEach(function(a){var d=(a.match(/\-/g)||[]).length;0==d?c.push(a):c=c.concat(b._calcDayRange(a))}),c}},{key:"_cleanTime",value:function _cleanTime(a){return a.match(/^[0-9]:[0-9]{2}/)&&(a="0"+a),a.match(/^[0-9]{2}:[0-9]{2}\-[0-9]:[0-9]{2}/)&&(a=a.substring(0,6)+"0"+a.substring(6)),a}},{key:"_initOpeningHoursObj",value:function _initOpeningHoursObj(){this.openingHours={su:[],mo:[],tu:[],we:[],th:[],fr:[],sa:[],ph:[]}}},{key:"_calcDayRange",value:function _calcDayRange(a){var b={su:0,mo:1,tu:2,we:3,th:4,fr:5,sa:6},c=a.split("-"),d=b[c[0]],e=b[c[1]],f=this._calcRange(d,e,6),g=[];return f.forEach(function(a){for(var c in b)b[c]==a&&g.push(c)}),g}},{key:"_calcRange",value:function _calcRange(a,b,c){if(a==b)return[a];for(var d=[a],e=a;e<(a<b?b:c);)e++,d.push(e);return a>b&&(d=d.concat(this._calcRange(0,b,c))),d}},{key:"_checkTime",value:function _checkTime(a){return!!a.match(/[0-9]{1,2}:[0-9]{2}\+/)||!!a.match(/[0-9]{1,2}:[0-9]{2}\-[0-9]{1,2}:[0-9]{2}/)||!!a.match(/off/)}},{key:"_checkDay",value:function _checkDay(a){var b=["mo","tu","we","th","fr","sa","su","ph"];if(a.match(/\-/g)){var c=a.split("-");if(-1!==b.indexOf(c[0])&&-1!==b.indexOf(c[1]))return!0}else if(-1!==b.indexOf(a))return!0;return!1}}]),a}();module.exports=OpeningHours;

},{}],3:[function(require,module,exports){
"use strict";function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}var OpeningHours=require("./OpeningHours"),deepEqual=require("fast-deep-equal"),TAG_UNSET="unset",TAG_INVALID="invalid",TransportHours=function(){function a(){_classCallCheck(this,a)}return _createClass(a,[{key:"tagsToHoursObject",value:function tagsToHoursObject(a){var b;try{b=a.opening_hours?new OpeningHours(a.opening_hours).getTable():TAG_UNSET}catch(a){b=TAG_INVALID}var c;try{c=a.interval?this.intervalStringToMinutes(a.interval):TAG_UNSET}catch(a){c=TAG_INVALID}var d,f;try{d=a["interval:conditional"]?this.intervalConditionalStringToObject(a["interval:conditional"]):TAG_UNSET,f=d===TAG_UNSET?TAG_UNSET:this._intervalConditionObjectToIntervalByDays(d)}catch(a){d=TAG_INVALID,f=TAG_INVALID}return{opens:b,defaultInterval:c,otherIntervals:d,otherIntervalsByDays:f}}},{key:"intervalConditionalStringToObject",value:function intervalConditionalStringToObject(a){var b=this;return this._splitMultipleIntervalConditionalString(a).map(function(a){return b._readSingleIntervalConditionalString(a)})}},{key:"_intervalConditionObjectToIntervalByDays",value:function _intervalConditionObjectToIntervalByDays(a){var b=[],c={};return a.forEach(function(a){Object.entries(a.applies).forEach(function(b){var d=_slicedToArray(b,2),e=d[0],f=d[1];c[e]||(c[e]={}),f.forEach(function(b){c[e][b]=a.interval})})}),Object.entries(c).forEach(function(a){var c=_slicedToArray(a,2),d=c[0],e=c[1];if(0<Object.keys(e).length){var f=b.filter(function(a){return deepEqual(a.intervals,e)});1===f.length?f[0].days.push(d):b.push({days:[d],intervals:e})}}),b}},{key:"_splitMultipleIntervalConditionalString",value:function _splitMultipleIntervalConditionalString(a){if(a.match(/\(.*\)/)){for(var b=a.split("").map(function(a,b){return";"===a?b:null}).filter(function(a){return null!==a}),c=0,d=[];0<b.length;){var e=b[0],f=a.substring(c,e);(f.match(/^[^\(\)]$/)||f.match(/\(.*\)/))&&(d.push(f),c=e+1),b.shift()}return d.push(a.substring(c)),d.map(function(a){return a.trim()}).filter(function(a){return 0<a.length})}return a.split(";").map(function(a){return a.trim()}).filter(function(a){return 0<a.length})}},{key:"_readSingleIntervalConditionalString",value:function _readSingleIntervalConditionalString(a){var b={},c=a.split("@").map(function(a){return a.trim()});if(2!==c.length)throw new Error("Conditional interval can't be parsed : "+a);return b.interval=this.intervalStringToMinutes(c[0]),c[1].match(/^\(.*\)$/)&&(c[1]=c[1].substring(1,c[1].length-1)),b.applies=new OpeningHours(c[1]).getTable(),b}},{key:"intervalStringToMinutes",value:function intervalStringToMinutes(a){if(a=a.trim(),/^\d{1,2}:\d{2}:\d{2}$/.test(a)){var b=a.split(":").map(function(a){return parseInt(a)});return 60*b[0]+b[1]+b[2]/60}if(/^\d{1,2}:\d{2}$/.test(a)){var c=a.split(":").map(function(a){return parseInt(a)});return 60*c[0]+c[1]}if(/^\d+$/.test(a))return parseInt(a);throw new Error("Interval value can't be parsed : "+a)}},{key:"minutesToIntervalString",value:function minutesToIntervalString(a){var b=Math.round,c=Math.floor;if("number"!=typeof a)throw new Error("Parameter minutes is not a number");var d=c(a/60),e=c(a%60),f=b(60*(a-60*d-e));return[d,e,f].map(function(a){return a.toString().padStart(2,"0")}).join(":")}}]),a}();module.exports=TransportHours;

},{"./OpeningHours":2,"fast-deep-equal":1}]},{},[3])(3)
});
