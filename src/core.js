var $Core = {};

$Core.newCall = function(Cls) {
  return new (Function.prototype.bind.apply(Cls, arguments));
};
