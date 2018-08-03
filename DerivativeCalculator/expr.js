
'use strict';

class CalcError extends Error {
    constructor(str) {
        super(str);
    }
}

class Coef {
    constructor(num, datum) {
        this.num = num;
        this.datum = {};
        if (this.num) {
            this.datum = Coef.mergeDatum(datum, {});
        }
    }
    multiply(a) {
        if (typeof a === 'number') {
            return new Coef(this.num * a, this.datum);
        } else if (a instanceof Coef) {
            return new Coef(this.num * a.num, Coef.mergeDatum(this.datum, a.datum));
        } else {
            return Expr.multiply(this.toExpr(), a.toExpr());
        }
    }
    divide(a) {
        if (typeof a === 'number') {
            return new Coef(this.num / a, this.datum);
        } else if (a instanceof Coef) {
            return new Coef(this.num / a.num, Coef.mergeDatum(this.datum, Coef.invertDatum(a.datum)));
        } else {
            return Expr.divide(this.toExpr(), a.toExpr());
        }
    }
    pow(a) {
        if (this.isZero()) return Coef.zero;
        if (this.isOne()) return Coef.one;
        if (a instanceof Coef && a.isConstant()) a = a.num;
        if (typeof a === 'number') {
            let d = {};
            for (let i in this.datum) {
                if (this.datum.hasOwnProperty(i)) d[i] = this.datum[i] * a;
            }
            return new Coef(Math.pow(this.num, a), d);
        } else {
            return Expr.pow(this.toExpr(), a.toExpr());
        }
    }
    toExpr() {
        return new StdExpr(this, 0);
    }
    toString() {
        let res = this.num.toString();
        if (this.isConstant()) return res;
        if (this.num === 1) res = '';
        if (this.num === -1) res = '-';
        for (let i in this.datum) {
            if (this.datum.hasOwnProperty(i) && this.datum[i]) {
                res += `${i}`;
                if (this.datum[i] !== 1) res += `^${this.datum[i]}`;
            }
        }
        return res;
    }
    isZero() {
        return this.num === 0;
    }
    isOne() {
        return this.num === 1 && this.isSimilarTerms(Coef.one);
    }
    isConstant() {
        if (this.isZero()) return true;
        for (let i in this.datum) {
            if (this.datum.hasOwnProperty(i) && this.datum[i]) return false;
        }
        return true;
    }
    isSimilarTerms(b) {
        if (this.isZero() || b.isZero()) return true;
        let x = this.datum, y = b.datum;
        for (let i in x) {
            if (x.hasOwnProperty(i) && x[i] && x[i] !== y[i]) return false;
        }
        for (let i in y) {
            if (y.hasOwnProperty(i) && y[i] && y[i] !== x[i]) return false;
        }
        return true;
    }
    static invertDatum(a) {
        let c = {};
        for (let i in a) {
            if (a.hasOwnProperty(i) && a[i]) c[i] = -a[i];
        }
        return c;
    }
    static mergeDatum(a, b) {
        let c = {};
        for (let i in a) {
            if (a.hasOwnProperty(i)) c[i] = a[i];
        }
        for (let i in b) {
            if (b.hasOwnProperty(i)) {
                if (i in c) c[i] += b[i];
                else c[i] = b[i];
            }
        }
        for (let i in c) {
            if (c.hasOwnProperty(i) && !c[i]) delete c[i];
        }
        return c;
    }
}

Coef.zero = new Coef(0, {});
Coef.one = new Coef(1, {});
Coef.m_one = new Coef(-1, {});

class Expr {
    constructor(type) {
        this.type = type;
        this.derivative = null;
    }
    toExpr() {
        return this;
    }
    toString() {
        return `<expr:${this.type}>`;
    }
    invert() {
        return this.multiply(Expr.m_one);
    }
    isConstant() {
        return false;
    }
    isDatum() {
        return false;
    }
    // Note: this method should be overwritten
    calcDerivative() {
        throw new CalcError(`Derivative of type "${this.type}" is not defined`);
    }
    getDerivative() {
        if (this.derivative === null) {
            this.derivative = this.calcDerivative();
        }
        return this.derivative;
    }
    plus(b) {
        if (b.plus !== this.plus) return b.plus(this);
        return Expr.plus(this, b);
    }
    minus(b) {
        return Expr.minus(this, b);
    }
    multiply(b) {
        if (b.multiply !== this.multiply) return b.multiply(this);
        return Expr.multiply(this, b);
    }
    divide(b) {
        return Expr.divide(this, b);
    }
    pow(b) {
        return Expr.pow(this, b);
    }
    log(b) {
        return Expr.log(this, b);
    }
    ln() {
        return Expr.ln(this);
    }
    static plus(a, b) {
        if (!(a instanceof StdExpr)) [a, b] = [b, a];
        if (a instanceof StdExpr) {
            if (a.isConstant() && a.coef.isZero()) return b;
            if (b.isConstant() && b.coef.isZero()) return a;
            if (b instanceof OprExpr && b.opr === '+' && b.a instanceof StdExpr && a.isSimilarTerms(b.a)) {
                return a.plus(b.a).plus(b.b);
            }
        }
        return new OprExpr('+', a, b);
    }
    static minus(a, b) {
        return a.plus(b.invert());
    }
    static mergeMD(s) {
        let k = [[], []], i;
        while (s.length) {
            let x = s.pop(), u = x[0], t = x[1];
            if (u instanceof StdExpr) {
                k[0].unshift(t ? Expr.one.divide(u) : u);
            } else if (u instanceof OprExpr) {
                if (u.opr === '*') {
                    s.push([u.a, t]);
                    s.push([u.b, t]);
                } else if (u.opr === '/') {
                    s.push([u.a, t]);
                    s.push([u.b, 1 ^ t]);
                } else k[t].push(u);
            } else k[t].push(u);
        }
        let a = k[0][0];
        for (i = 1; i < k[0].length && k[0][i] instanceof StdExpr; ++i) a = a.multiply(k[0][i]);
        if (i < k[0].length) {
            let A = k[0][i];
            for (++i; i < k[0].length; ++i) A = new OprExpr('*', A, k[0][i]);
            if (a instanceof StdExpr && a.isConstant() && a.coef.isOne()) a = A;
            else a = new OprExpr('*', a, A);
        }
        if (a instanceof StdExpr && a.isConstant() && a.coef.isZero()) {
            return Expr.zero;
        }
        if (!k[1].length) return a;
        let b = k[1][0];
        for (let i = 1; i < k[1].length; ++i) b = new OprExpr('*', b, k[1][i]);
        return new OprExpr('/', a, b);
    }
    static multiply(a, b) {
        /*
        if (b instanceof StdExpr) [a, b] = [b, a];
        if (a instanceof StdExpr) {
            if (a.isConstant()) {
                if (a.coef.isZero()) return Expr.zero;
                if (a.coef.isOne()) return b;
            }
            if (b instanceof StdExpr) return a.multiply(b);
            if (b instanceof OprExpr && b.opr === '*' && b.a instanceof StdExpr) {
                return a.multiply(b.a).multiply(b.b);
            }
        }
        return new OprExpr('*', a, b);
        */
        return Expr.mergeMD([[a, 0], [b, 0]]);
    }
    static divide(a, b) {
        return Expr.mergeMD([[a, 0], [b, 1]]);
    }
    static pow(a, b) {
        if (b.isConstant()) {
            if (b.coef.isZero()) return Expr.one;
            if (b.coef.isOne()) return a;
        }
        return new OprExpr('^', a, b);
    }
    static log(a, b) {
        return new OprExpr('log', a, b);
    }
    static ln(a) {
        //if (a.isConstant()) return Expr.fromNumber(FuncExpr.calc('ln', a.coef.num));
        return new FuncExpr('ln', a);
    }
    static fromNumber(a) {
        return new StdExpr(new Coef(a, {}), 0);
    }
    static fromLetter(a) {
        if (a === 'x') return new StdExpr(Coef.one, 1);
        let datum = {};
        datum[a] = 1;
        return new StdExpr(new Coef(1, datum), 0);
    }
}

class StdExpr extends Expr {
    constructor(coef, degree) {
        super('std');
        this.coef = coef;
        this.degree = coef.isZero() ? 0 : degree;
    }
    isSimilarTerms(b) {
        return this.degree === b.degree && this.coef.isSimilarTerms(b.coef);
    }
    isConstant() {
        return this.isDatum() && this.coef.isConstant();
    }
    isDatum() {
        return this.degree === 0;
    }
    toString() {
        let res = this.coef.toString();
        if (this.isDatum()) return res;
        if (res === '1') res = '';
        if (res === '-1') res = '-';
        res += 'x';
        if (this.degree !== 1) res += `^${this.degree}`;
        return res;
    }
    plus(b) {
        if (this.coef.isZero()) return b;
        if (b instanceof StdExpr && this.isSimilarTerms(b)) {
            if (b.coef.isZero()) return this;
            let coef = new Coef(this.coef.num + b.coef.num, this.coef.datum);
            return new StdExpr(coef, this.degree);
        }
        return Expr.plus(this, b);
    }
    multiply(b) {
        if (this.isDatum()) {
            if (this.coef.isZero()) return Expr.zero;
            if (this.coef.isOne()) return b;
        }
        if (b instanceof StdExpr) {
            if (b.isDatum()) {
                if (b.coef.isZero()) return Expr.zero;
                if (b.coef.isOne()) return this;
            }
            return new StdExpr(this.coef.multiply(b.coef), this.degree + b.degree);
        }
        return Expr.multiply(this, b);
    }
    divide(b) {
        if (this.isDatum() && this.coef.isZero()) return Expr.zero;
        if (b instanceof StdExpr) {
            if (b.isDatum() && b.coef.isOne()) return this;
            return new StdExpr(this.coef.divide(b.coef), this.degree - b.degree);
        }
        return Expr.divide(this, b);
    }
    pow(b) {
        if (this.isDatum()) {
            if (this.coef.isZero()) return Expr.zero;
            if (this.coef.isOne()) return Expr.one;
        }
        if (b.isConstant()) {
            let d = b.coef.num;
            return new StdExpr(this.coef.pow(d), this.degree * d);
        }
        return Expr.pow(this, b);
    }
    calcDerivative() {
        if (this.isConstant()) return Expr.zero;
        return new StdExpr(this.coef.multiply(this.degree), this.degree - 1);
    }
}

Expr.zero = Coef.zero.toExpr();
Expr.one = Coef.one.toExpr();
Expr.m_one = Coef.m_one.toExpr();
Expr.x = new StdExpr(Coef.one, 1);

class FuncExpr extends Expr {
    constructor(fn, arg) {
        super('func');
        this.fn = fn;
        this.arg = arg;
        this.derivativeOfArgument = null;
    }
    toString() {
        return `${this.fn}[${this.arg.toString()}]`;
    }
    calcDerivative() {
        return this.arg.getDerivative().multiply(this.getDerivativeOfArgument());
    }
    calcDerivativeOfArgument() {
        let f = FuncExpr.getFunction(this.fn);
        if (!f.fn.calcDerivative) {
            throw new CalcError(`Derivative of function "${this.fn}" is not defined`);
        }
        return f.fn.calcDerivative(this.arg);
    }
    getDerivativeOfArgument() {
        if (!this.derivativeOfArgument) {
            this.derivativeOfArgument = this.calcDerivativeOfArgument();
        }
        return this.derivativeOfArgument;
    }
    static calc(fn, arg) {
        let f = FuncExpr.getFunction(fn);
        if (!f.fn.calc) throw new CalcError(`Derivative of function "${fn}" is not defined`);
        return f.fn.calc(arg);
    }
    static getFunction(fn) {
        let f = FuncExpr.functions.find(function(a) {
            return a.name === fn;
        });
        if (!f) throw new CalcError(`Function "${fn}" is not defined`);
        return f;
    }
    static addFunction(name, fn) {
        this.functions.push({
            name: name,
            fn: fn
        });
    }
}

FuncExpr.functions = [];
FuncExpr.addFunction('sin', {
    calc(a) {
        return Math.sin(a);
    },
    calcDerivative(a) {
        return new FuncExpr('cos', a);
    }
});
FuncExpr.addFunction('cos', {
    calc(a) {
        return Math.cos(a);
    },
    calcDerivative(a) {
        return new FuncExpr('sin', a).invert();
    }
});
FuncExpr.addFunction('tan', {
    calc(a) {
        return Math.tan(a);
    },
    calcDerivative(a) {
        return Expr.one.divide(new FuncExpr('cos', a).pow(Expr.fromNumber(2)));
    }
});
FuncExpr.addFunction('ln', {
    calc(a) {
        return Math.log(a);
    },
    calcDerivative(a) {
        return Expr.one.divide(a);
    }
});

class OprExpr extends Expr {
    constructor(opr, a, b) {
        super('opr');
        this.opr = opr;
        this.a = a;
        this.b = b;
    }
    static needBrackets(str, opr, side) {
        const priority = ['+-', '*/', '^'];
        const combMap = new Map([
            ['+', 0],
            ['-', 1],
            ['*', 0],
            ['/', 1],
            ['^', 3]
        ]); // 0-both 1-ltr 2-rtl 3-always-add-bracket
        function getPriority(a) {
            return priority.findIndex(function(b) {
                return b.indexOf(a) !== -1;
            });
        }
        let p = getPriority(opr);
        let tmp = '', cnt = 0;
        for (let i = 0; i < str.length; ++i) {
            if (str[i] === '(' || str[i] === '[') ++cnt;
            if (str[i] === ')' || str[i] === ']') --cnt;
            if (!cnt) {
                let q = getPriority(str[i]);
                if (q !== -1) {
                    if (q < p) return true;
                    if (q === p) tmp += str[i];
                }
            }
        }
        let comb = combMap.get(opr);
        if (!tmp || !comb || comb === side) return false;
        if (comb !== side) return true;
        for (let i = 0; i < tmp.length; ++i) {
            let x = combMap.get(tmp[i]);
            if (x && x !== comb) return true;
        }
        return false;
    }
    toString() {
        let A = this.a.toString(), B = this.b.toString(), opr = this.opr;
        if (opr.length === 1) {
            if (opr === '*' && A === '-1') {
                A = ''; opr = '-';
            }
            if (OprExpr.needBrackets(A, opr, 1)) A = `(${A})`;
            if (OprExpr.needBrackets(B, opr, 2)) B = `(${B})`;
            let pm = /[-\+]/;
            if (pm.test(opr) && pm.test(B[0])) {
                return A + (opr === B[0] ? '+' : '-') + B.slice(1);
            }
            return A + opr + B;
        } else {
            return `${opr}[${A},${B}]`;
        }
    }
    calcDerivative() {
        let u = this.a, v = this.b;
        switch (this.opr) {
            case '+':
                return u.getDerivative().plus(v.getDerivative());
            case '*':
                return v.multiply(u.getDerivative()).plus(u.multiply(v.getDerivative()));
            case '/':
                return v.multiply(u.getDerivative())
                    .minus(u.multiply(v.getDerivative()))
                    .divide(v.pow(Expr.fromNumber(2)));
            case '^': case 'pow': {
                let f1 = u.isDatum(), f2 = v.isDatum();
                if (f1 && f2) return Expr.zero;
                if (f1) return u.pow(v).multiply(v.getDerivative()).multiply(u.ln());
                if (f2) return v.multiply(u.getDerivative()).multiply(u.pow(v.minus(Expr.one)));
                return u.pow(v).multiply(
                    v.getDerivative().multiply(u.ln()).plus(
                        v.multiply(u.getDerivative()).divide(u)
                    )
                );
            }
            case 'log': { // log v(u)
                return u.ln().divide(v.ln()).getDerivative();
            }
            default: throw new CalcError(`Derivative of operation "${this.opr}" is not defined`);
        }
    }
}
