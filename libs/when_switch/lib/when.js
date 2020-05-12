"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var resolve = function (resolvedValue) {
	return ({
		is: function () { return resolve(resolvedValue); },
		match: function () { return resolve(resolvedValue); },
		else: function () { return resolvedValue; }
	});
};

exports.when = function (expr) {
	return ({
		is: function (constExpr, value) {
			return expr === constExpr
				? resolve(typeof value === 'function' ? value(constExpr) : value)
				: exports.when(expr);
		},
		match: function (matcher, value) {
			return matcher.test(expr)
				? resolve(typeof value === 'function' ? value(expr) : value)
				: exports.when(expr);
		},
		else: function (defaultValue) {
			return typeof defaultValue === 'function' ? defaultValue(expr) : defaultValue;
		}
	});
};

exports.default = exports.when;