
function once(func) {
  var run = false;
  var res;
  
  return function() {
    var args = Array.prototype.slice.call(arguments);
    if (!run) {
      run = true;
      res = func.apply(null, args);
    }
    return res;
  };
}

module.exports = once;
