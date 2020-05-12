'use strict';

// @ Locutus.io
exports.php = class {
	static inArray(needle, haystack, argStrict) {
		var key = '';
		var strict = !!argStrict;

		// we prevent the double check (strict && arr[key] === ndl) || (!strict && arr[key] === ndl)
		// in just one for, in order to improve the performance
		// deciding wich type of comparation will do before walk array
		if (strict)
		{
			for (key in haystack)
			{
				if (haystack[key] === needle)
				{
					return true;
				}
			}
		}
		else
		{
			for (key in haystack)
			{
				if (haystack[key] == needle)
				{
					return true;
				}
			}
		}

		return false
	}

	static arrayFilter(arr, func) {
		var retObj = {};
		var k;

		func = func || function(v) { return v; };

		if (Object.prototype.toString.call(arr) === '[object Array]')
		{
			retObj = [];
		}

		for (k in arr)
		{
			if (func(arr[k]))
			{
				retObj[k] = arr[k];
			}
		}

		return retObj;
	}

	static arrayValues(input) {
		var tmpArr = [];
		var key = '';

		for (key in input)
		{
			tmpArr[tmpArr.length] = input[key];
		}

		return tmpArr;
	}

	static arrayPad(input, padSize, padValue) {
		var pad = [];
		var newArray = [];
		var newLength;
		var diff = 0;
		var i = 0;

		if (Object.prototype.toString.call(input) === '[object Array]' && !isNaN(padSize))
		{
			newLength = ((padSize < 0) ? (padSize * -1) : padSize);
			diff = newLength - input.length;

			if (diff > 0)
			{
				for (i=0 ; i<diff ; i++)
				{
					newArray[i] = padValue;
				}
				pad = ((padSize < 0) ? newArray.concat(input) : input.concat(newArray));
			}
			else
			{
				pad = input;
			}
		}

		return pad;
	}

	static arrayFill(startIndex, num, mixedVal) {
		var key;
		var tmpArr = {};

		if (!isNaN(startIndex) && !isNaN(num))
		{
			for (key=0 ; key<num ; key++)
			{
				tmpArr[key + startIndex] = mixedVal;
			}
		}

		return tmpArr;
	}

	static arrayIntersect(arr1) {
		var retArr = [];
		var argl = arguments.length;
		var arglm1 = argl - 1;
		var k1 = '';
		var arr = {};
		var i = 0;
		var k = '';

		arr1keys: for (k1 in arr1)
		{
			arrs: for (i = 1; i < argl; i++)
			{
				arr = arguments[i];
				for (k in arr)
				{
					if (arr[k] === arr1[k1])
					{
						if (i === arglm1)
						{
							retArr[retArr.length] = arr1[k1];
						}

						// If the innermost loop always leads at least once to an equal value,
						// continue the loop until done
						continue arrs;
					}
				}

				// If it reaches here, it wasn't found in at least one array, so try next value
				continue arr1keys;
			}
		}

		return retArr;
	}

	static arrayUnique(inputArr) {
		var key = '';
		var tmpArr2 = [];
		var val = '';

		var _arraySearch = function(needle, haystack) {
			var fkey = '';
			for (fkey in haystack)
			{
				if (haystack.hasOwnProperty(fkey))
				{
					if ((haystack[fkey] + '') === (needle + '')) return fkey;
				}
			}

			return false;
		};

		for (key in inputArr)
		{
			if (inputArr.hasOwnProperty(key))
			{
				val = inputArr[key];
				if (_arraySearch(val, tmpArr2) === false)
				{
					tmpArr2[key] = val;
				}
			}
		}

		return tmpArr2;
	}

	static strReplace(search, replace, subject, countObj) {
		var i    = 0;
		var j    = 0;
		var temp = '';
		var repl = '';
		var sl   = 0;
		var fl   = 0;
		var f    = [].concat(search);
		var r    = [].concat(replace);
		var s    = subject;
		var ra   = Object.prototype.toString.call(r) === '[object Array]';
		var sa   = Object.prototype.toString.call(s) === '[object Array]';

		s = [].concat(s);
		if (typeof (search) === 'object' && typeof (replace) === 'string')
		{
			temp = replace;
			replace = [];
			for (i=0 ; i<search.length ; i++)
			{
				replace[i] = temp;
			}
			temp = '';
			r = [].concat(replace);
			ra = Object.prototype.toString.call(r) === '[object Array]';
		}

		if (typeof countObj !== 'undefined')
		{
			countObj.value = 0;
		}

		for (i=0, sl=s.length ; i<sl ; i++)
		{
			if (s[i] === '') continue;

			for (j=0, fl=f.length ; j<fl ; j++)
			{
				temp = s[i] + '';
				repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
				s[i] = (temp).split(f[j]).join(repl);
				if (typeof countObj !== 'undefined')
				{
					countObj.value += ((temp.split(f[j])).length - 1);
				}
			}
		}

		return sa ? s : s[0];
	}

	static strpos(haystack, needle, offset) {
		var i = (haystack + '').indexOf(needle, (offset || 0));

		return i === -1 ? false : i;
	}

	static strcmp(str1, str2) {
		if (str1 === str2) return  0;
		if (str1  >  str2) return  1;
		if (str1  <  str2) return -1;
	}

	static rtrim(str, charlist) {
		charlist = !charlist ? '\\s\u00A0' : (charlist + '').replace(/([[\]().?/*{}+$^:])/g, '\\$1');
		var re = new RegExp('[' + charlist + ']+$', 'g');

		return (str + '').replace(re, '');
	}

	static ucfirst(str) {
		str += '';
		var f = str.charAt(0).toUpperCase();

		return f + str.substr(1);
	}

	static ucwords(str) {
		return (str + '').replace(/^(.)|\s+(.)/g, function($1) { return $1.toUpperCase(); });
	}

	static dirname(path) {
		return path.replace(/\\/g, '/').replace(/\/[^/]*\/?$/, '');
	}

	static basename(path, suffix) {
		var b = path;
		var lastChar = b.charAt(b.length - 1);

		if (lastChar == '/' || lastChar === '\\') {
			b = b.slice(0, -1);
		};

		b = b.replace(/^.*[/\\]/g, '');

		if (typeof suffix === 'string' && b.substr(b.length - suffix.length) === suffix) {
			b = b.substr(0, b.length - suffix.length);
		}

		return b;
	}
};