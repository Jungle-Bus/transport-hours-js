(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TransportHours = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
Array.prototype.flat||Object.defineProperty(Array.prototype,"flat",{configurable:!0,value:function r(){var t=isNaN(arguments[0])?1:Number(arguments[0]);return t?Array.prototype.reduce.call(this,function(a,e){return Array.isArray(e)?a.push.apply(a,r.call(e,t-1)):a.push(e),a},[]):Array.prototype.slice.call(this)},writable:!0}),Array.prototype.flatMap||Object.defineProperty(Array.prototype,"flatMap",{configurable:!0,value:function(r){return Array.prototype.map.apply(this,arguments).flat()},writable:!0})

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
"use strict";function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}var OpeningHours=function(){function a(b){if(_classCallCheck(this,a),this.openingHours={},this._parse(b),Object.values(this.openingHours).filter(function(a){return 0===a.length}).length===Object.keys(this.openingHours).length)throw new Error("Can't parse opening_hours : "+b)}return _createClass(a,[{key:"getTable",value:function getTable(){return this.openingHours}},{key:"_parse",value:function _parse(a){var b=this;this._initOpeningHoursObj(),a=this._simplify(a);var c=this._splitHard(a);c.forEach(function(a){b._parseHardPart(a)})}},{key:"_simplify",value:function _simplify(a){return"24/7"==a&&(a="mo-su 00:00-24:00; ph 00:00-24:00"),a=a.toLocaleLowerCase(),a=a.trim(),a=a.replace(/ +(?= )/g,""),a=a.replace(" -","-"),a=a.replace("- ","-"),a=a.replace(" :",":"),a=a.replace(": ",":"),a=a.replace(" ,",","),a=a.replace(", ",","),a=a.replace(" ;",";"),a=a.replace("; ",";"),a}},{key:"_splitHard",value:function _splitHard(a){return a.split(";")}},{key:"_parseHardPart",value:function _parseHardPart(a){var b=this;"24/7"==a&&(a="mo-su 00:00-24:00");var c=a.split(/\ |\,/),d={},e=[],f=[];for(var g in c.forEach(function(a,c){b._checkDay(a)&&(0===f.length?e=e.concat(b._parseDays(a)):(e.forEach(function(a){d[a]=d[a]?d[a].concat(f):f}),e=b._parseDays(a),f=[])),b._checkTime(a)&&(0===c&&0===e.length&&(e=b._parseDays("Mo-Su,PH")),"off"==a?f=[]:f.push(b._cleanTime(a)))}),e.forEach(function(a){d[a]=d[a]?d[a].concat(f):f}),0<e.length&&0===f.length&&e.forEach(function(a){d[a]=["00:00-24:00"]}),d)this.openingHours[g]=d[g]}},{key:"_parseDays",value:function _parseDays(a){var b=this;a=a.toLowerCase();var c=[],d=a.split(",");return d.forEach(function(a){var d=(a.match(/\-/g)||[]).length;0==d?c.push(a):c=c.concat(b._calcDayRange(a))}),c}},{key:"_cleanTime",value:function _cleanTime(a){return a.match(/^[0-9]:[0-9]{2}/)&&(a="0"+a),a.match(/^[0-9]{2}:[0-9]{2}\-[0-9]:[0-9]{2}/)&&(a=a.substring(0,6)+"0"+a.substring(6)),a}},{key:"_initOpeningHoursObj",value:function _initOpeningHoursObj(){this.openingHours={su:[],mo:[],tu:[],we:[],th:[],fr:[],sa:[],ph:[]}}},{key:"_calcDayRange",value:function _calcDayRange(a){var b={su:0,mo:1,tu:2,we:3,th:4,fr:5,sa:6},c=a.split("-"),d=b[c[0]],e=b[c[1]],f=this._calcRange(d,e,6),g=[];return f.forEach(function(a){for(var c in b)b[c]==a&&g.push(c)}),g}},{key:"_calcRange",value:function _calcRange(a,b,c){if(a==b)return[a];for(var d=[a],e=a;e<(a<b?b:c);)e++,d.push(e);return a>b&&(d=d.concat(this._calcRange(0,b,c))),d}},{key:"_checkTime",value:function _checkTime(a){return!!a.match(/[0-9]{1,2}:[0-9]{2}\+/)||!!a.match(/[0-9]{1,2}:[0-9]{2}\-[0-9]{1,2}:[0-9]{2}/)||!!a.match(/off/)}},{key:"_checkDay",value:function _checkDay(a){var b=["mo","tu","we","th","fr","sa","su","ph"];if(a.match(/\-/g)){var c=a.split("-");if(-1!==b.indexOf(c[0])&&-1!==b.indexOf(c[1]))return!0}else if(-1!==b.indexOf(a))return!0;return!1}}]),a}();module.exports=OpeningHours;

},{}],4:[function(require,module,exports){
"use strict";function _slicedToArray(a,b){return _arrayWithHoles(a)||_iterableToArrayLimit(a,b)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}return c}function _arrayWithHoles(a){if(Array.isArray(a))return a}function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}require("array-flat-polyfill");var OpeningHours=require("./OpeningHours"),deepEqual=require("fast-deep-equal"),TAG_UNSET="unset",TAG_INVALID="invalid",TransportHours=function(){function a(){_classCallCheck(this,a)}return _createClass(a,[{key:"tagsToHoursObject",value:function tagsToHoursObject(a){var b;try{b=a.opening_hours?new OpeningHours(a.opening_hours).getTable():TAG_UNSET}catch(a){b=TAG_INVALID}var c;try{c=a.interval?this.intervalStringToMinutes(a.interval):TAG_UNSET}catch(a){c=TAG_INVALID}var d,f;try{d=a["interval:conditional"]?this.intervalConditionalStringToObject(a["interval:conditional"]):TAG_UNSET,f=d===TAG_UNSET?TAG_UNSET:this._intervalConditionObjectToIntervalByDays(d)}catch(a){d=TAG_INVALID,f=TAG_INVALID}var g;try{g=this._computeAllIntervals(b,c,f)}catch(a){g=TAG_INVALID}return{opens:b,defaultInterval:c,otherIntervals:d,otherIntervalsByDays:f,allComputedIntervals:g}}},{key:"_computeAllIntervals",value:function _computeAllIntervals(a,b,c){var d=this;if(a===TAG_INVALID||b===TAG_INVALID||b===TAG_UNSET||c===TAG_INVALID)return(a===TAG_INVALID||b===TAG_INVALID)&&c===TAG_UNSET?TAG_INVALID:c;var e=c===TAG_UNSET?[]:c,f=a;a===TAG_UNSET&&(f=new OpeningHours("24/7").getTable());var g=[];e.forEach(function(a){a.days.forEach(function(b){g.push({days:[b],intervals:a.intervals})})}),g=g.map(function(a){var c=f[a.days[0]];return a.intervals=d._mergeIntervalsSingleDay(c,b,a.intervals),a});var h=_toConsumableArray(new Set(e.map(function(a){return a.days}).flat())),k=Object.keys(f).filter(function(a){return!h.includes(a)}),l={};k.forEach(function(a){l[a]=f[a]}),g=g.concat(this._intervalConditionObjectToIntervalByDays([{interval:b,applies:l}]));for(var n=1;n<g.length;n++)for(var i=0;i<n;i++)if(deepEqual(g[n].intervals,g[i].intervals)){g[i].days=g[i].days.concat(g[n].days),g.splice(n,1),n--;break}var m=["mo","tu","we","th","fr","sa","su","ph"];return g.forEach(function(a){return a.days.sort(function(c,a){return m.indexOf(c)-m.indexOf(a)})}),g.sort(function(c,a){return m.indexOf(c.days[0])-m.indexOf(a.days[0])}),g}},{key:"_mergeIntervalsSingleDay",value:function _mergeIntervalsSingleDay(a,b,c){var d=function(a){return a.map(function(a){return a.split("-")})},e=d(a),f=d(Object.keys(c)),g=f.filter(function(a){for(var b,c=!1,d=0;d<e.length;d++)if(b=e[d],a[0]>=b[0]&&a[1]<=b[1]){c=!0;break}return!c});if(0<g.length)throw new Error("Conditional intervals are not contained in opening hours");var h=[];e.forEach(function(a){var b=[];(0===f.length||a[0]!==f[0][0])&&b.push(a[0]),f.forEach(function(c){c[0]>a[0]&&c[0]<a[1]&&b.push(c[0]),c[1]>a[0]&&c[1]<a[1]&&b.push(c[1])}),(0===f.length||a[1]!==f[f.length-1][1])&&b.push(a[1]),h=h.concat(b.map(function(a,c){return 0==c%2?null:b[c-1]+"-"+a}).filter(function(a){return null!==a}))});var i={};return h.forEach(function(a){i[a]=b}),i=Object.assign(i,c),i}},{key:"intervalConditionalStringToObject",value:function intervalConditionalStringToObject(a){var b=this;return this._splitMultipleIntervalConditionalString(a).map(function(a){return b._readSingleIntervalConditionalString(a)})}},{key:"_intervalConditionObjectToIntervalByDays",value:function _intervalConditionObjectToIntervalByDays(a){var b=[],c={};return a.forEach(function(a){Object.entries(a.applies).forEach(function(b){var d=_slicedToArray(b,2),e=d[0],f=d[1];c[e]||(c[e]={}),f.forEach(function(b){c[e][b]=a.interval})})}),Object.entries(c).forEach(function(a){var c=_slicedToArray(a,2),d=c[0],e=c[1];if(0<Object.keys(e).length){var f=b.filter(function(a){return deepEqual(a.intervals,e)});1===f.length?f[0].days.push(d):b.push({days:[d],intervals:e})}}),b}},{key:"_splitMultipleIntervalConditionalString",value:function _splitMultipleIntervalConditionalString(a){if(a.match(/\(.*\)/)){for(var b=a.split("").map(function(a,b){return";"===a?b:null}).filter(function(a){return null!==a}),c=0,d=[];0<b.length;){var e=b[0],f=a.substring(c,e);(f.match(/^[^\(\)]$/)||f.match(/\(.*\)/))&&(d.push(f),c=e+1),b.shift()}return d.push(a.substring(c)),d.map(function(a){return a.trim()}).filter(function(a){return 0<a.length})}return a.split(";").map(function(a){return a.trim()}).filter(function(a){return 0<a.length})}},{key:"_readSingleIntervalConditionalString",value:function _readSingleIntervalConditionalString(a){var b={},c=a.split("@").map(function(a){return a.trim()});if(2!==c.length)throw new Error("Conditional interval can't be parsed : "+a);return b.interval=this.intervalStringToMinutes(c[0]),c[1].match(/^\(.*\)$/)&&(c[1]=c[1].substring(1,c[1].length-1)),b.applies=new OpeningHours(c[1]).getTable(),b}},{key:"intervalStringToMinutes",value:function intervalStringToMinutes(a){if(a=a.trim(),/^\d{1,2}:\d{2}:\d{2}$/.test(a)){var b=a.split(":").map(function(a){return parseInt(a)});return 60*b[0]+b[1]+b[2]/60}if(/^\d{1,2}:\d{2}$/.test(a)){var c=a.split(":").map(function(a){return parseInt(a)});return 60*c[0]+c[1]}if(/^\d+$/.test(a))return parseInt(a);throw new Error("Interval value can't be parsed : "+a)}},{key:"minutesToIntervalString",value:function minutesToIntervalString(a){var b=Math.round,c=Math.floor;if("number"!=typeof a)throw new Error("Parameter minutes is not a number");var d=c(a/60),e=c(a%60),f=b(60*(a-60*d-e));return[d,e,f].map(function(a){return a.toString().padStart(2,"0")}).join(":")}}]),a}();module.exports=TransportHours;

},{"./OpeningHours":3,"array-flat-polyfill":1,"fast-deep-equal":2}]},{},[4])(4)
});
