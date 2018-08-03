
class ParserError extends Error {
    constructor(msg, pos, fullstr, exprstk, oprstk) {
        super(msg);
        this.pos = pos;
        this.fullstr = fullstr;
        this.exprstk = exprstk;
        this.oprstk = oprstk;
    }
}

let ExprParser = (function() {

    const lb = '([', rb = ')]';
    const reInvalid = /[^a-zA-Z0-9\.\,\+\-\*\/\^\(\)\[\]]/;
    const reNumber = /^(\.\d+|\d+(\.\d*)?)([eE][\+\-]?\d+)?/;

    const operators = [
        {
            opr: '(', priority: 1, comb: 'ltr'
        },
        {
            opr: ')', priority: 1, comb: '?'
        },
        {
            opr: '+', priority: 2, comb: 'both',
            calc(a, b) { return a.plus(b); }
        },
        {
            opr: '+.', priority: 9, comb: 'both',
            calc(a, b) { return a.plus(b); }
        },
        {
            opr: '-', priority: 2, comb: 'ltr',
            calc(a, b) { return a.minus(b); }
        },
        {
            opr: '-.', priority: 9, comb: 'ltr',
            calc(a, b) { return a.minus(b); }
        },
        {
            opr: '*', priority: 3, comb: 'both',
            calc(a, b) { return a.multiply(b); }
        },
        {
            opr: '/', priority: 3, comb: 'ltr',
            calc(a, b) { return a.divide(b); }
        },
        {
            opr: '*.', priority: 4, comb: 'both',
            calc(a, b) { return a.multiply(b); }
        },
        {
            opr: '^', priority: 5, comb: 'rtl',
            calc(a, b) { return a.pow(b); }
        }
    ];

    let currentStr = null;

    function error(msg, pos) {
        if (typeof pos !== 'undefined') {
            throw new ParserError(msg, pos, currentStr);
        } else {
            throw new ParserError(msg);
        }
    }

    function getOperator(opr) {
        return operators.find(function(a) {
            return a.opr === opr;
        });
    }

    function getPriority(opr) {
        let x = getOperator(opr);
        return x ? x.priority : -1;
    }

    function replaceFunction(str, fn) {
        let tmp = '', last = 0;
        fn.forEach(function(a, i) {
            tmp += str.slice(last, a.l);
            tmp += '{' + i + '}';
            last = a.r;
        });
        return tmp + str.slice(last);
    }
    
    function parse(str, pos) {

        if (!str) throw new TypeError("parsing empty string at pos " + pos);

        let fn = [];

        let error = function(msg, i) {
            throw new ParserError(msg, pos + i, currentStr);
        };

        for (let i = 0; i < str.length;) {
            if (str[i] === '[') {
                let t = str.slice(0, i).match(/[a-zA-Z][a-zA-Z0-9]*$/);
                if (!t) error('unexpected [', i);
                let last, j, args = [];
                let cnt = 1;
                for (last = j = i + 1; cnt; ++j) {
                    if (lb.indexOf(str[j]) !== -1) ++cnt;
                    if (rb.indexOf(str[j]) !== -1) --cnt;
                    if (!cnt || (str[j] === ',' && cnt === 1)) {
                        if (last === j) error('unexpected ' + str[j], j);
                        args.push(parse(str.slice(last, j), pos + last));
                        last = j + 1;
                    }
                }
                let res;
                if (args.length === 1) res = new FuncExpr(t[0], args[0]);
                else if (args.length === 2) res = new OprExpr(t[0], args[0], args[1]);
                else error('too much arguments for function', i);
                fn.push({
                    v: res,
                    l: i - t[0].length,
                    r: j
                });
                i = j;
            } else ++i;
        }

        str = replaceFunction(str, fn);

        let expr = [], oprs = [];
        let lastType = 0; // 1-number/letter, 2-operator

        function getRealPos(p) {
            for (let i = 0; i < fn.length; ++i) {
                if (p < fn[i].l) break;
                p += fn[i].r - fn[i].l;
            }
            return pos + p;
        }

        error = function(msg, i) {
            let oprs_new = oprs.map(function(a) {
                return [a[0], getRealPos(a[1])];
            });
            throw new ParserError(msg, getRealPos(i), currentStr, expr, oprs_new);
        };

        function calcValue(opr, i) {
            let o = getOperator(opr);
            if (!o) error("invalid operator " + opr, i);
            if (expr.length < 2) error("unexpected operator " + opr, i);
            let b = expr.pop();
            let a = expr.pop();
            expr.push(o.calc(a, b));
        }

        function pushopr(opr, i) {
            let p = getPriority(opr);
            if (p === -1) error("invalid operator " + opr, i);
            while (oprs.length) {
                let q = oprs.pop();
                let oq = getOperator(q[0]);
                let pq = oq.priority;
                if (oq.comb === 'rtl' ? pq > p : pq >= p) {
                    if (q[0] === '(') return;
                    calcValue(q[0], q[1]);
                } else {
                    oprs.push(q);
                    break;
                }
            }
            oprs.push([opr, i]);
        }

        for (let i = 0; i < str.length; ++i) {
            let ts = str.slice(i);
            let tmp = ts.match(reNumber);
            if (tmp !== null) {
                if (lastType === 1) error("unexpected number " + tmp[0], i);
                lastType = 1;
                expr.push(Expr.fromNumber(parseFloat(tmp[0])));
                i += tmp[0].length - 1;
            } else if (/[a-zA-Z]/.test(str[i])) {
                if (lastType === 1) pushopr('*.', i);
                lastType = 1;
                expr.push(Expr.fromLetter(str[i]));
            } else if (str[i] === '{') {
                if (lastType === 1) pushopr('*.', i);
                lastType = 1;
                tmp = ts.match(/^{(\d+)}/);
                expr.push(fn[parseInt(tmp[1])].v);
                i += tmp[0].length - 1;
            } else {
                switch (str[i]) {
                    case '(':
                        if (lastType === 1) {
                            pushopr('*.', i);
                        }
                        lastType = 2;
                        oprs.push(['(', i]);
                        break;
                    case ')':
                        if (lastType === 1) {
                            pushopr(')', i);
                            break;
                        }
                        error('unexpected )', i);
                        break;
                    case '+': case '-':
                        if (lastType !== 1) {
                            expr.push(Expr.zero);
                            lastType = 2;
                            pushopr(str[i] + '.', i);
                            break;
                        }
                    case '*': case '/': case '^':
                        if (lastType === 1) {
                            pushopr(str[i], i);
                            lastType = 2;
                            break;
                        }
                    default: error(`unexpected operator ${str[i]}`, i);
                }
            }
        }

        if (lastType !== 1) {
            error('unexpected end of expression', str.length);
        }
        pushopr(')', str.length);

        if (expr.length > 1) error('more than one expression', pos);
        return expr[0];
    }

    function checkSymbols(str) {
        let t = str.match(reInvalid);
        if (t !== null) error(`invalid character ${t[0]}`, t.index);
    }

    function checkBrackets(str) {
        let tmp = [], pos = [], p, q;
        for (let i = 0; i < str.length; ++i) {
            let p = lb.indexOf(str[i]),
                q = rb.indexOf(str[i]);
            if (p !== -1) {
                tmp.push(p);
                pos.push(i);
            }
            if (q !== -1) {
                if (!tmp.length) error('no matching left bracket', i);
                let p = tmp.pop();
                if (p !== q) error(`unexpected ${str[i]} ("${rb[p]}" expected)`, i);
                pos.pop();
            }
        }
        if (pos.length) error('no matching right bracket', pos.pop());
    }

    function checkDemicalPoints(str) {
        let tmp = str.match(/(\.\d*|[a-zA-Z])\./);
        if (tmp !== null) error('unexpected .', tmp.index + tmp[0].length - 1);
    }

    function parseInterface(str) {
        str = str.replace(/\s/g, '');
        if (!str) error('expression must not be empty');
        currentStr = str;
        checkSymbols(str);
        checkBrackets(str);
        checkDemicalPoints(str);
        return parse(str, 0, str);
    }

    return {
        parse: parseInterface
    };
})();
