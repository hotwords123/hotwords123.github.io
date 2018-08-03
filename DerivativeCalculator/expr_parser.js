
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

    const operators = [
        {
            opr: '(', priority: 0, comb: 'ltr'
        },
        {
            opr: ')', priority: 0, comb: '?'
        },
        {
            opr: '[', priority: 1, comb: 'ltr',
            calc(a, b) {
                if (b.length === 1) return new FuncExpr(a, b[0]);
                if (b.length === 2) return new OprExpr(a, b[0], b[1]);
            }
        },
        {
            opr: ']', priority: 1, comb: '?'
        },
        {
            opr: ',', priority: 2, comb: 'ltr',
            calc(a, b) { return a.concat([b]); }
        },
        {
            opr: '+', priority: 10, comb: 'both',
            calc(a, b) { return a.plus(b); }
        },
        {
            opr: '+.', priority: 19, comb: 'both',
            calc(a, b) { return a.plus(b); }
        },
        {
            opr: '-', priority: 10, comb: 'ltr',
            calc(a, b) { return a.minus(b); }
        },
        {
            opr: '-.', priority: 19, comb: 'ltr',
            calc(a, b) { return a.minus(b); }
        },
        {
            opr: '*', priority: 11, comb: 'both',
            calc(a, b) { return a.multiply(b); }
        },
        {
            opr: '/', priority: 11, comb: 'ltr',
            calc(a, b) { return a.divide(b); }
        },
        {
            opr: '*.', priority: 12, comb: 'both',
            calc(a, b) { return a.multiply(b); }
        },
        {
            opr: '^', priority: 13, comb: 'rtl',
            calc(a, b) { return a.pow(b); }
        }
    ];

    function top(arr) {
        return arr.length ? arr[arr.length - 1] : null;
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
    
    function parse(str) {

        let error = function(msg, pos) {
            throw new ParserError(msg, pos, str);
        };

        str = str.replace(/\s/g, '');
        if (!str) error('expression must not be empty');
        
        // check invalid characters
        let tinv = str.match(/[^a-zA-Z0-9.,+\-*\/^()\[\]]/);
        if (tinv !== null) error(`invalid character ${tinv[0]}`, tinv.index);

        // check brackets
        let bstack = [], pos = [];
        for (let i = 0; i < str.length; ++i) {
            let p = lb.indexOf(str[i]),
                q = rb.indexOf(str[i]);
            if (p !== -1) {
                bstack.push(p);
                pos.push(i);
            }
            if (q !== -1) {
                if (!bstack.length) error('no matching left bracket', i);
                let p = bstack.pop();
                if (p !== q) error(`unexpected ${str[i]} ("${rb[p]}" expected)`, i);
                pos.pop();
            }
        }
        if (pos.length) error('no matching right bracket', pos.pop());

        // preprocess functions
        let fn = [];
        for (let i = 0; i < str.length; ++i) {
            if (str[i] === '[') {
                let t = str.slice(0, i).match(/[a-zA-Z][a-zA-Z0-9]*$/);
                if (!t) error('unexpected [ (no function name)', i);
                fn.push({
                    name: t[0],
                    pos: i - t[0].length,
                    start: i
                });
            }
        }

        let expr = [], oprs = [];
        let lastType = 0; // 1-number/letter, 2-operator

        error = function(msg, pos) {
            throw new ParserError(msg, pos, str, expr, oprs);
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
                    if (q[0] === '[') return;
                } else {
                    oprs.push(q);
                    break;
                }
            }
            oprs.push([opr, i]);
        }

        let fpos = 0, f;

        for (let i = 0; i < str.length; ++i) {
            if (fpos < fn.length) {
                f = fn[fpos];
                if (i === f.pos) {
                    i = f.start;
                    fpos++;
                }
            }
            let ts = str.slice(i);
            let tmp = ts.match(/^(\.\d+|\d+(\.\d*)?)([eE][\+\-]?\d+)?/);
            if (tmp !== null) {
                if (lastType === 1) error("unexpected number " + tmp[0], i);
                lastType = 1;
                expr.push(Expr.fromNumber(parseFloat(tmp[0])));
                i += tmp[0].length - 1;
            } else if (/[a-zA-Z]/.test(str[i])) {
                if (lastType === 1) pushopr('*.', i);
                lastType = 1;
                expr.push(Expr.fromLetter(str[i]));
            } else {
                switch (str[i]) {
                    case '[':
                        if (lastType === 1) pushopr('*.', i);
                        lastType = 2;
                        expr.push(f.name);
                        oprs.push(['[', i]);
                        expr.push([]);
                        oprs.push([',', -1]);
                        break;
                    case '(':
                        if (lastType === 1) pushopr('*.', i);
                        lastType = 2;
                        oprs.push(['(', i]);
                        break;
                    case ')':
                        if (lastType === 1) {
                            pushopr(')', i);
                            break;
                        }
                        error(`unexpected ${str[i]} (expected expression)`, i);
                    case ',':
                        if (lastType !== 1) error("unexpected , (expected expression)", i);
                        pushopr(',', i);
                        if (oprs.length < 2 || oprs[oprs.length - 2][0] !== '[') {
                            error("unexpected , (not in arguments list)", i);
                        }
                        if (top(expr).length === 2) error('too much arguments for function', i);
                        lastType = 2;
                        break;
                    case ']':
                        if (lastType !== 1) error("unexpected ] (expected expression)", i);
                        lastType = 1;
                        pushopr(']', i);
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
            error('unexpected end of expression (expected expression)', str.length);
        }

        pushopr(')', -1);

        if (expr.length > 1) error('more than one expression (might be a bug)', pos);
        return expr[0];
    }

    return {
        parse: parse
    };
})();
