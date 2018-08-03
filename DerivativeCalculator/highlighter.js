
'use strict';

$.fn.setClass = function(name, flag) {
    if (flag) this.addClass(name);
    else this.removeClass(name);
    return this;
};

class Highlighter {
    constructor(src) {
        this.$src = $(src);
        this.$currentMatches = null;
        this.matches = null;
        this.clicking = false;
        this.selecting = false;
        this.selected = false;
        this.initDOM();
        this.adjustDOM();
        this.addListeners();
        this.highlight();
    }
    initDOM() {
        this.$src.addClass('highlighter-source');
        this.$src.prop('spellcheck', false)
            .prop('autocorrect', 'off')
            .prop('autocapitalize', 'off')
            .prop('autocomplete', 'off');
        this.$dest = $('<div class="highlighter">');
        this.$dest_box = $('<div class="highlighter-box">');
        this.$dest_main = $('<div class="highlighter-main">');
        this.$dest_add = $('<div class="highlighter-add">');
        this.$cursor = $('<span class="highlighter-cursor hidden">');
        this.$measurer = $('<span class="highlighter-measurer">');
        $('body').append(this.$dest
            .append(this.$dest_box
            .append(this.$dest_add
                .append(this.$cursor)
                .append(this.$measurer))
            .append(this.$dest_main)));
    }
    adjustDOM() {
        const styles = [
            'padding[Top,Right,Bottom,Left]',
            'font[Style,Variant,Weight,Size,Family]',
            'border[Top,Right,Bottom,Left][Width,Style]',
            'lineHeight'
        ];
        let $src = this.$src;
        let offset = this.$src.offset();
        let zIndex = +this.$src.css('zIndex');
        let css = {
            'left': offset.left,
            'top': offset.top,
            'width': this.$src.width(),
            'height': this.$src.height(),
            'zIndex': isNaN(zIndex) ? 1 : zIndex + 1
        };
        function expandStyle(pre, str) {
            let p = str.indexOf('[');
            if (p === -1) {
                css[pre + str] = $src.css(pre + str);
                return;
            }
            let q = str.indexOf(']');
            let a = str.slice(0, p);
            let c = str.slice(q + 1);
            str.slice(p + 1, q).split(',').forEach(function(b) {
                expandStyle(pre + a + b, c);
            });
        }
        styles.forEach(function(a) {
            expandStyle('', a);
        });
        this.$dest.css(css);
    }
    addListeners() {
        let self = this;
        this.$src.on('input', function() {
            self.highlight();
        }).on('focus', function() {
            self.delayUpdateCursor();
        }).on('blur', function() {
            self.updateAdd();
        }).on('mousedown', function() {
            self.clicking = true;
            self.selecting = false;
            self.delayUpdateCursor();
            self.delayUpdateScroll();
        }).on('keydown', function(e) {
            self.keydownHandler(e);
            self.delayUpdateCursor();
            self.delayUpdateScroll();
        }).on('keypress', function(e) {
            self.keypressHandler(e);
        });
        $(window).resize(function() {
            self.adjustDOM();
        }).on('mousemove', function() {
            if (self.clicking) {
                self.selecting = true;
            }
        }).on('mouseup', function() {
            if (self.clicking) {
            self.clicking = false;
                self.delayUpdateCursor();
            if (self.selecting) {
                self.selecting = false;
            }
            }
        });
    }
    getValue(val) {
        return this.$src.val();
    }
    setValue(val) {
        this.$src.val(val);
        this.highlight();
    }
    measureText(str) {
        return this.$measurer.text(str).width();
    }
    removeBlanks() {
        const re = /\s/g;
        let dom = this.$src[0];
        let str = dom.value;
        if (re.test(str)) {
            let sl = dom.selectionStart;
            let sr = dom.selectionEnd;
            let a = (str.slice(0, sl).match(re) || []).length;
            let b = (str.slice(sl, sr).match(re) || []).length;
            dom.value = str.replace(re, '');
            dom.selectionStart = sl - a;
            dom.selectionEnd = sr - a - b;
        }
    }
    highlight() {
        this.removeBlanks();
        let val = this.getValue();
        let obj = Highlighter.parse(val);
        let res = obj.groups;
        this.matches = obj.matches;
        this.$dest_main.html('');
        for (let i = 0; i < res.length; ) {
            let $dom = $('<span>');
            let str = res[i].text, type = res[i].type;
            $dom.addClass('highlighter-' + type);
            while (++i < res.length && res[i].type === type) str += res[i].text;
            $dom.text(str);
            this.$dest_main.append($dom);
        }
        this.delayUpdateCursor();
        this.delayUpdateScroll();
    }
    keydownHandler(e) {
        if (e.which === 8) {
            let H = Highlighter;
            let dom = this.$src[0];
            let sl = dom.selectionStart, sr = dom.selectionEnd;
            if (sl !== sr || !sl) return;
            let str = dom.value;
            if (sl < str.length && H.idLBracket(str[sl - 1]) !== -1 && H.idRBracket(str[sl]) !== -1) {
                dom.value = str.slice(0, sl - 1) + str.slice(sl + 1);
                dom.selectionStart = dom.selectionEnd = sl - 1;
                this.highlight();
                e.preventDefault();
            }
        }
    }
    keypressHandler(e) {
        let char = String.fromCharCode(e.which);
        if (/\s/.test(char)) {
            e.preventDefault();
            return;
        }
        let H = Highlighter;
        if (H.idLBracket(char) !== -1) {
            let dom = this.$src[0];
            let sl = dom.selectionStart, sr = dom.selectionEnd;
            let str = dom.value;
            let r = H.rBracket(char);
            if (sl === sr) {
                if (sl < str.length && /[a-zA-Z0-9\.]/.test(str[sl])) return;
                for (let i = sl + 1; i < str.length; ++i) {
                    if (H.idRBracket(str[i]) !== -1) {
                        if (str[i] === r) {
                            if (!this.findMatches(i)) return;
                        } else break;
                    }
                }
                dom.value = str.slice(0, sl) + char + r + str.slice(sl);
                dom.selectionStart = dom.selectionEnd = sl + 1;
                this.highlight();
            } else {
                dom.value = str.slice(0, sl) + char + str.slice(sl, sr) + r + str.slice(sr);
                dom.selectionStart = sl + 1;
                dom.selectionEnd = sr + 1;
                this.highlight();
            }
            e.preventDefault();
        } else if (H.idRBracket(char) !== -1) {
            let dom = this.$src[0];
            let sl = dom.selectionStart, sr = dom.selectionEnd;
            let str = dom.value;
            let l = H.lBracket(char);
            if (sl !== sr) return;
            if (sl === str.length || str[sl] !== char) return;
            for (let i = sl - 1; i >= 0; --i) {
                if (H.idLBracket(str[i]) !== -1) {
                    if (str[i] === l) {
                        if (!this.findMatches(i)) return;
                    } else break;
                }
            }
            dom.selectionStart = dom.selectionEnd = sl + 1;
            this.updateCursor();
            e.preventDefault();
        }
    }
    findMatches(pos) {
        return this.matches.find(function(a) {
            return a[0] === pos || a[1] === pos;
        });
    }
    updateAdd() {
        let focus = this.$src.is(':focus');
        this.$cursor.setClass('hidden', !focus || this.selecting || this.selected);
        if (this.$currentMatches) {
            this.$currentMatches.forEach(function(a) {
                a.setClass('hidden', !focus);
            });
        }
    }
    updateCursor() {
        let dom = this.$src[0];
        let sl = dom.selectionStart;
        let sr = dom.selectionEnd;
        let cp = dom.selectionDirection === 'forward' ? sr : sl;
        let str = this.getValue();
        this.selected = sl !== sr;
        this.$cursor.css('left', this.measureText(str.slice(0, cp)));
        if (this.$currentMatches) {
            this.$currentMatches[0].remove();
            this.$currentMatches[1].remove();
            this.$currentMatches = null;
        }
        let res = (function (sl, sr) {
            let res;
            if (sl === sr) {
                if (sl < str.length && (res = this.findMatches(sl))) return res;
                if (sl > 0 && (res = this.findMatches(sl - 1))) return res;
            } else if (sr - sl === 1) {
                if (res = this.findMatches(sl)) return res;
            }
            return null;
        }).call(this, sl, sr);
        if (res) {
            this.$currentMatches = [null, null];
            for (let i = 0; i < 2; ++i) {
                this.$currentMatches[i] = $('<div>')
                    .addClass('highlighter-bracket-match')
                    .css('left', this.measureText(str.slice(0, res[i])))
                    .css('width', this.measureText(str[res[i]]));
                this.$dest_add.append(this.$currentMatches[i]);
            }
        }
    }
    delayUpdateCursor() {
        let self = this;
        window.requestAnimationFrame(function() {
            self.updateCursor();
            self.updateAdd();
        });
    }
    updateScroll() {
        this.$dest_box.css('transform', `translateX(-${this.$src.scrollLeft()}px)`);
    }
    delayUpdateScroll() {
        let self = this;
        window.requestAnimationFrame(function() {
            self.updateScroll();
            if (self.clicking) self.delayUpdateScroll();
        });
    }
    static isSymbol(a) {
        return Highlighter.symbols.indexOf(a) !== -1;
    }
    static idLBracket(a) {
        return Highlighter.brackets.l.indexOf(a);
    }
    static idRBracket(a) {
        return Highlighter.brackets.r.indexOf(a);
    }
    static lBracket(a) {
        return Highlighter.brackets.l[Highlighter.idRBracket(a)];
    }
    static rBracket(a) {
        return Highlighter.brackets.r[Highlighter.idLBracket(a)];
    }
    static bracketClass(a) {
        let t, H = Highlighter;
        if ((t = H.idLBracket(a)) !== -1 || (t = H.idRBracket(a)) !== -1) return H.brackets.c[t];
        return null;
    }
    static parse(val) {
        const re = /([^a-zA-Z0-9\.])/;
        let H = Highlighter;
        let arr = val.split(re);
        let res = [];
        let matched = [];
        let matches = [];
        let k = [], len = [0];
        arr = arr.filter(function(a) {
            return !!a;
        });
        for (let i = 0; i < arr.length; ++i) {
            len[i + 1] = len[i] + arr[i].length;
            if (arr[i].length !== 1) continue;
            if (H.idLBracket(arr[i]) !== -1) k.push(i);
            else if (H.idRBracket(arr[i]) !== -1) {
                while (k.length) {
                    let p = k.pop();
                    let l = arr[p];
                    if (arr[i] === H.rBracket(l)) {
                        matched.push(p);
                        matched.push(i);
                        matches.push([len[p], len[i]]);
                        break;
                    }
                }
            }
        }
        function add(a, b) {
            res.push({ type: a, text: b });
        }
        for (let i = 0; i < arr.length; ++i) {
            let f = arr[i];
            if (!f) continue;
            if (f.match(re)) {
                let type = 'error';
                if (H.isSymbol(f)) {
                    type = 'symbol';
                } else if (matched.indexOf(i) !== -1) {
                    type = 'bracket-' + H.bracketClass(f);
                }
                add(type, f);
            } else {
                if (!isNaN(+f)) {
                    add('number', f); continue;
                }
                if (/^\.\d+|(\d+(\.\d*)?)[eE]$/.test(f) && i + 2 < arr.length && /[-+]/.test(arr[i + 1])) {
                    let tmp = arr[i + 2].match(/^\d+/);
                    if (tmp) {
                        add('number', f + arr[i + 1] + tmp[0]);
                        arr[i + 2] = arr[i + 2].slice(tmp[0].length);
                        ++i; continue;
                    }
                }
                let t = f.match(/^([0-9\.]*)(.*)/);
                if (t[1]) {
                    if (isNaN(t[1])) add('error', t[1]);
                    else {
                        let tmp = t[2].match(/^[eE]\d+/);
                        if (tmp) {
                            t[1] += tmp[0];
                            t[2] = t[2].slice(tmp[0].length);
                        }
                        add('number', t[1]);
                    }
                }
                if (t[2]) {
                    if (i + 1 < arr.length && arr[i + 1] === '[') {
                        add(/\./.test(t[2]) ? 'error' : 'function', t[2]);
                    } else {
                        t[2].split('').forEach(function(g) {
                            let type;
                            if (/[^a-zA-Z]/.test(g)) type = 'error';
                            else if (g === 'x') type = 'letter-unknown';
                            else type = 'letter-datum';
                            add(type, g);
                        });
                    }
                }
            }
        }
        return {
            groups: res,
            matches: matches
        };
    }
}

Highlighter.symbols = '+-*/^,';
Highlighter.brackets = { l: '([', r: ')]', c: ['small', 'middle'] };