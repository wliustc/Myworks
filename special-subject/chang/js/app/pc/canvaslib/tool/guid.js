define(function (require, exports,module) {
/**
 * zrender: 生成唯一id
 *
 * @author errorrik (errorrik@gmail.com)
 */


var idStart = 2311;
module.exports = function () {
    return 'zrender__' + idStart++;
};
});