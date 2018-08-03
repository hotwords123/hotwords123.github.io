
'use strict';

function cutpx(a) {
    return +a.match(/^(.+)px$/)[1];
}

function fillString(str, cnt) {
    let res = '', tmp = str;
    while (cnt) {
        if (cnt & 1) res += tmp;
        tmp += tmp;
        cnt >>= 1;
    }
    return res;
}

let $input, $result;
let info;
let debugMode = false;
let inputExpr = null, resultExpr = null;
let inputHighlighter, outputHighlighter;

function parseInput() {
    inputExpr = ExprParser.parse(inputHighlighter.getValue());
}

function calculate() {
    resultExpr = inputExpr.getDerivative();
    outputHighlighter.setValue(resultExpr.toString());
    info.setText('Calculation succeeded.', 'success');
}

function showError(err) {
    let arr = [];
    if (err instanceof ParserError) {
        arr.push('Failed to parse the input expression.');
        arr.push('Message: ' + err.message);
        if (err.fullstr && Number.isInteger(err.pos)) {
            arr.push(err.fullstr);
            arr.push(fillString(' ', err.pos) + '^here');
            if (debugMode) {
                if (err.exprstk && err.exprstk instanceof Array) {
                    arr.push('Expressions stack:');
                    if (!err.exprstk.length) arr.push('<empty>');
                    else err.exprstk.forEach(function(a, i) {
                        arr.push(`${i}=${a.toString()}`);
                    });
                }
                if (err.oprstk && err.oprstk instanceof Array) {
                    let tmpstr = fillString(' ', err.fullstr.length).split('');
                    arr.push('Operators stack:');
                    if (!err.oprstk.length) arr.push('<empty>');
                    else {
                        err.oprstk.forEach(function(a, i) {
                            arr.push(`${i}=${a[0]} at ${a[1]}`);
                            tmpstr[a[1]] = '^';
                        });
                        arr.push(err.fullstr);
                        arr.push(tmpstr.join(''));
                    }
                }
            }
        }
    } else if (err instanceof CalcError) {
        arr.push('Failed to calculate the derivative.');
        arr.push('Message: ' + err.message);
    } else {
        arr.push('An unexcepted error occured:');
        arr.push(err.stack);
    }
    info.setText(arr.join('\n'), 'error');
}

$(function() {

    $input = $('#expr-in');
    $result = $('#expr-out');

    inputHighlighter = new Highlighter($input);
    outputHighlighter = new Highlighter($result);

    info = {
        $dom: $('#info'),
        lastType: null,
        setText(text, type) {
            this.$dom.text(text);
            if (type) this.setType(type);
        },
        setHTML(html, type) {
            this.$dom.html(html);
            if (type) this.setType(type);
        },
        setType(type) {
            if (this.lastType) this.$dom.removeClass('info-' + this.lastType);
            this.$dom.addClass('info-' + type);
            this.lastType = type;
        }
    };
    info.setText('Ready.', 'message');

    $('#btn-parse').click(function() {
        try {
            parseInput();
            outputHighlighter.setValue(inputExpr.toString());
            info.setText('Successfully parsed the input expression.', 'success');
        } catch (err) {
            showError(err);
        }
    });

    $('#btn-calc').click(function() {
        try {
            parseInput();
            calculate();
        } catch (err) {
            showError(err);
        }
    });

    $('#btn-recalc').click(function() {
        if (!resultExpr) {
            showError(new CalcError("derivative of input not calculated"));
            return;
        }
        inputHighlighter.setValue(resultExpr.toString());
        inputExpr = resultExpr;
        try {
            calculate();
        } catch (err) {
            showError(err);
        }
    });

    $('#btn-clear').click(function() {
        inputExpr = null;
        resultExpr = null;
        inputHighlighter.setValue('');
        outputHighlighter.setValue('');
        info.setText('Ready.', 'message');
    });

    $('#btn-debug').click(function() {
        debugMode = !debugMode;
        $(this).setClass('inverted', debugMode);
    });

});