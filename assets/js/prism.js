/* http://prismjs.com/download.html?themes=prism-okaidia&languages=markup+css+clike+javascript+bash+coffeescript+go+java+php+python+sass+scss+swift */
var _self =
    "undefined" != typeof window
      ? window
      : "undefined" != typeof WorkerGlobalScope &&
        self instanceof WorkerGlobalScope
      ? self
      : {},
  Prism = (function () {
    var e = /\blang(?:uage)?-(\w+)\b/i,
      t = 0,
      n = (_self.Prism = {
        manual: _self.Prism && _self.Prism.manual,
        util: {
          encode: function (e) {
            return e instanceof a
              ? new a(e.type, n.util.encode(e.content), e.alias)
              : "Array" === n.util.type(e)
              ? e.map(n.util.encode)
              : e
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/\u00a0/g, " ");
          },
          type: function (e) {
            return Object.prototype.toString
              .call(e)
              .match(/\[object (\w+)\]/)[1];
          },
          objId: function (e) {
            return (
              e.__id || Object.defineProperty(e, "__id", { value: ++t }), e.__id
            );
          },
          clone: function (e) {
            var t = n.util.type(e);
            switch (t) {
              case "Object":
                var a = {};
                for (var r in e)
                  e.hasOwnProperty(r) && (a[r] = n.util.clone(e[r]));
                return a;
              case "Array":
                return (
                  e.map &&
                  e.map(function (e) {
                    return n.util.clone(e);
                  })
                );
            }
            return e;
          },
        },
        languages: {
          extend: function (e, t) {
            var a = n.util.clone(n.languages[e]);
            for (var r in t) a[r] = t[r];
            return a;
          },
          insertBefore: function (e, t, a, r) {
            r = r || n.languages;
            var i = r[e];
            if (2 == arguments.length) {
              a = arguments[1];
              for (var l in a) a.hasOwnProperty(l) && (i[l] = a[l]);
              return i;
            }
            var o = {};
            for (var s in i)
              if (i.hasOwnProperty(s)) {
                if (s == t)
                  for (var l in a) a.hasOwnProperty(l) && (o[l] = a[l]);
                o[s] = i[s];
              }
            return (
              n.languages.DFS(n.languages, function (t, n) {
                n === r[e] && t != e && (this[t] = o);
              }),
              (r[e] = o)
            );
          },
          DFS: function (e, t, a, r) {
            r = r || {};
            for (var i in e)
              e.hasOwnProperty(i) &&
                (t.call(e, i, e[i], a || i),
                "Object" !== n.util.type(e[i]) || r[n.util.objId(e[i])]
                  ? "Array" !== n.util.type(e[i]) ||
                    r[n.util.objId(e[i])] ||
                    ((r[n.util.objId(e[i])] = !0),
                    n.languages.DFS(e[i], t, i, r))
                  : ((r[n.util.objId(e[i])] = !0),
                    n.languages.DFS(e[i], t, null, r)));
          },
        },
        plugins: {},
        highlightAll: function (e, t) {
          var a = {
            callback: t,
            selector:
              'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
          };
          n.hooks.run("before-highlightall", a);
          for (
            var r,
              i = a.elements || document.querySelectorAll(a.selector),
              l = 0;
            (r = i[l++]);

          )
            n.highlightElement(r, e === !0, a.callback);
        },
        highlightElement: function (t, a, r) {
          for (var i, l, o = t; o && !e.test(o.className); ) o = o.parentNode;
          o &&
            ((i = (o.className.match(e) || [, ""])[1].toLowerCase()),
            (l = n.languages[i])),
            (t.className =
              t.className.replace(e, "").replace(/\s+/g, " ") +
              " language-" +
              i),
            (o = t.parentNode),
            /pre/i.test(o.nodeName) &&
              (o.className =
                o.className.replace(e, "").replace(/\s+/g, " ") +
                " language-" +
                i);
          var s = t.textContent,
            u = { element: t, language: i, grammar: l, code: s };
          if ((n.hooks.run("before-sanity-check", u), !u.code || !u.grammar))
            return (
              u.code &&
                (n.hooks.run("before-highlight", u),
                (u.element.textContent = u.code),
                n.hooks.run("after-highlight", u)),
              n.hooks.run("complete", u),
              void 0
            );
          if ((n.hooks.run("before-highlight", u), a && _self.Worker)) {
            var g = new Worker(n.filename);
            (g.onmessage = function (e) {
              (u.highlightedCode = e.data),
                n.hooks.run("before-insert", u),
                (u.element.innerHTML = u.highlightedCode),
                r && r.call(u.element),
                n.hooks.run("after-highlight", u),
                n.hooks.run("complete", u);
            }),
              g.postMessage(
                JSON.stringify({
                  language: u.language,
                  code: u.code,
                  immediateClose: !0,
                })
              );
          } else
            (u.highlightedCode = n.highlight(u.code, u.grammar, u.language)),
              n.hooks.run("before-insert", u),
              (u.element.innerHTML = u.highlightedCode),
              r && r.call(t),
              n.hooks.run("after-highlight", u),
              n.hooks.run("complete", u);
        },
        highlight: function (e, t, r) {
          var i = n.tokenize(e, t);
          return a.stringify(n.util.encode(i), r);
        },
        matchGrammar: function (e, t, a, r, i, l, o) {
          var s = n.Token;
          for (var u in a)
            if (a.hasOwnProperty(u) && a[u]) {
              if (u == o) return;
              var g = a[u];
              g = "Array" === n.util.type(g) ? g : [g];
              for (var c = 0; c < g.length; ++c) {
                var h = g[c],
                  f = h.inside,
                  d = !!h.lookbehind,
                  m = !!h.greedy,
                  p = 0,
                  y = h.alias;
                if (m && !h.pattern.global) {
                  var v = h.pattern.toString().match(/[imuy]*$/)[0];
                  h.pattern = RegExp(h.pattern.source, v + "g");
                }
                h = h.pattern || h;
                for (var b = r, k = i; b < t.length; k += t[b].length, ++b) {
                  var w = t[b];
                  if (t.length > e.length) return;
                  if (!(w instanceof s)) {
                    h.lastIndex = 0;
                    var _ = h.exec(w),
                      P = 1;
                    if (!_ && m && b != t.length - 1) {
                      if (((h.lastIndex = k), (_ = h.exec(e)), !_)) break;
                      for (
                        var A = _.index + (d ? _[1].length : 0),
                          j = _.index + _[0].length,
                          x = b,
                          O = k,
                          S = t.length;
                        S > x && (j > O || (!t[x].type && !t[x - 1].greedy));
                        ++x
                      )
                        (O += t[x].length), A >= O && (++b, (k = O));
                      if (t[b] instanceof s || t[x - 1].greedy) continue;
                      (P = x - b), (w = e.slice(k, O)), (_.index -= k);
                    }
                    if (_) {
                      d && (p = _[1].length);
                      var A = _.index + p,
                        _ = _[0].slice(p),
                        j = A + _.length,
                        N = w.slice(0, A),
                        C = w.slice(j),
                        E = [b, P];
                      N && (++b, (k += N.length), E.push(N));
                      var L = new s(u, f ? n.tokenize(_, f) : _, y, _, m);
                      if (
                        (E.push(L),
                        C && E.push(C),
                        Array.prototype.splice.apply(t, E),
                        1 != P && n.matchGrammar(e, t, a, b, k, !0, u),
                        l)
                      )
                        break;
                    } else if (l) break;
                  }
                }
              }
            }
        },
        tokenize: function (e, t) {
          var a = [e],
            r = t.rest;
          if (r) {
            for (var i in r) t[i] = r[i];
            delete t.rest;
          }
          return n.matchGrammar(e, a, t, 0, 0, !1), a;
        },
        hooks: {
          all: {},
          add: function (e, t) {
            var a = n.hooks.all;
            (a[e] = a[e] || []), a[e].push(t);
          },
          run: function (e, t) {
            var a = n.hooks.all[e];
            if (a && a.length) for (var r, i = 0; (r = a[i++]); ) r(t);
          },
        },
      }),
      a = (n.Token = function (e, t, n, a, r) {
        (this.type = e),
          (this.content = t),
          (this.alias = n),
          (this.length = 0 | (a || "").length),
          (this.greedy = !!r);
      });
    if (
      ((a.stringify = function (e, t, r) {
        if ("string" == typeof e) return e;
        if ("Array" === n.util.type(e))
          return e
            .map(function (n) {
              return a.stringify(n, t, e);
            })
            .join("");
        var i = {
          type: e.type,
          content: a.stringify(e.content, t, r),
          tag: "span",
          classes: ["token", e.type],
          attributes: {},
          language: t,
          parent: r,
        };
        if (
          ("comment" == i.type && (i.attributes.spellcheck = "true"), e.alias)
        ) {
          var l = "Array" === n.util.type(e.alias) ? e.alias : [e.alias];
          Array.prototype.push.apply(i.classes, l);
        }
        n.hooks.run("wrap", i);
        var o = Object.keys(i.attributes)
          .map(function (e) {
            return (
              e + '="' + (i.attributes[e] || "").replace(/"/g, "&quot;") + '"'
            );
          })
          .join(" ");
        return (
          "<" +
          i.tag +
          ' class="' +
          i.classes.join(" ") +
          '"' +
          (o ? " " + o : "") +
          ">" +
          i.content +
          "</" +
          i.tag +
          ">"
        );
      }),
      !_self.document)
    )
      return _self.addEventListener
        ? (_self.addEventListener(
            "message",
            function (e) {
              var t = JSON.parse(e.data),
                a = t.language,
                r = t.code,
                i = t.immediateClose;
              _self.postMessage(n.highlight(r, n.languages[a], a)),
                i && _self.close();
            },
            !1
          ),
          _self.Prism)
        : _self.Prism;
    var r =
      document.currentScript ||
      [].slice.call(document.getElementsByTagName("script")).pop();
    return (
      r &&
        ((n.filename = r.src),
        !document.addEventListener ||
          n.manual ||
          r.hasAttribute("data-manual") ||
          ("loading" !== document.readyState
            ? window.requestAnimationFrame
              ? window.requestAnimationFrame(n.highlightAll)
              : window.setTimeout(n.highlightAll, 16)
            : document.addEventListener("DOMContentLoaded", n.highlightAll))),
      _self.Prism
    );
  })();
"undefined" != typeof module && module.exports && (module.exports = Prism),
  "undefined" != typeof global && (global.Prism = Prism);
(Prism.languages.markup = {
  comment: /<!--[\s\S]*?-->/,
  prolog: /<\?[\s\S]+?\?>/,
  doctype: /<!DOCTYPE[\s\S]+?>/i,
  cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
  tag: {
    pattern:
      /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\s\S])*\1|[^\s'">=]+))?)*\s*\/?>/i,
    inside: {
      tag: {
        pattern: /^<\/?[^\s>\/]+/i,
        inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ },
      },
      "attr-value": {
        pattern: /=(?:('|")[\s\S]*?(\1)|[^\s>]+)/i,
        inside: { punctuation: /[=>"']/ },
      },
      punctuation: /\/?>/,
      "attr-name": {
        pattern: /[^\s>\/]+/,
        inside: { namespace: /^[^\s>\/:]+:/ },
      },
    },
  },
  entity: /&#?[\da-z]{1,8};/i,
}),
  Prism.hooks.add("wrap", function (a) {
    "entity" === a.type &&
      (a.attributes.title = a.content.replace(/&amp;/, "&"));
  }),
  (Prism.languages.xml = Prism.languages.markup),
  (Prism.languages.html = Prism.languages.markup),
  (Prism.languages.mathml = Prism.languages.markup),
  (Prism.languages.svg = Prism.languages.markup);
(Prism.languages.css = {
  comment: /\/\*[\s\S]*?\*\//,
  atrule: { pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i, inside: { rule: /@[\w-]+/ } },
  url: /url\((?:(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
  selector: /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
  string: {
    pattern: /("|')(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  property: /(\b|\B)[\w-]+(?=\s*:)/i,
  important: /\B!important\b/i,
  function: /[-a-z0-9]+(?=\()/i,
  punctuation: /[(){};:]/,
}),
  (Prism.languages.css.atrule.inside.rest = Prism.util.clone(
    Prism.languages.css
  )),
  Prism.languages.markup &&
    (Prism.languages.insertBefore("markup", "tag", {
      style: {
        pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
        lookbehind: !0,
        inside: Prism.languages.css,
        alias: "language-css",
      },
    }),
    Prism.languages.insertBefore(
      "inside",
      "attr-value",
      {
        "style-attr": {
          pattern: /\s*style=("|').*?\1/i,
          inside: {
            "attr-name": {
              pattern: /^\s*style/i,
              inside: Prism.languages.markup.tag.inside,
            },
            punctuation: /^\s*=\s*['"]|['"]\s*$/,
            "attr-value": { pattern: /.+/i, inside: Prism.languages.css },
          },
          alias: "language-css",
        },
      },
      Prism.languages.markup.tag
    ));
Prism.languages.clike = {
  comment: [
    { pattern: /(^|[^\\])\/\*[\s\S]*?\*\//, lookbehind: !0 },
    { pattern: /(^|[^\\:])\/\/.*/, lookbehind: !0 },
  ],
  string: {
    pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  "class-name": {
    pattern:
      /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
    lookbehind: !0,
    inside: { punctuation: /(\.|\\)/ },
  },
  keyword:
    /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
  boolean: /\b(true|false)\b/,
  function: /[a-z0-9_]+(?=\()/i,
  number: /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
  operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
  punctuation: /[{}[\];(),.:]/,
};
(Prism.languages.javascript = Prism.languages.extend("clike", {
  keyword:
    /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
  number:
    /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
  function: /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
  operator:
    /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/,
})),
  Prism.languages.insertBefore("javascript", "keyword", {
    regex: {
      pattern:
        /(^|[^\/])\/(?!\/)(\[.+?]|\\.|[^\/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
      lookbehind: !0,
      greedy: !0,
    },
  }),
  Prism.languages.insertBefore("javascript", "string", {
    "template-string": {
      pattern: /`(?:\\\\|\\?[^\\])*?`/,
      greedy: !0,
      inside: {
        interpolation: {
          pattern: /\$\{[^}]+\}/,
          inside: {
            "interpolation-punctuation": {
              pattern: /^\$\{|\}$/,
              alias: "punctuation",
            },
            rest: Prism.languages.javascript,
          },
        },
        string: /[\s\S]+/,
      },
    },
  }),
  Prism.languages.markup &&
    Prism.languages.insertBefore("markup", "tag", {
      script: {
        pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
        lookbehind: !0,
        inside: Prism.languages.javascript,
        alias: "language-javascript",
      },
    }),
  (Prism.languages.js = Prism.languages.javascript);
!(function (e) {
  var t = {
    variable: [
      {
        pattern: /\$?\(\([\s\S]+?\)\)/,
        inside: {
          variable: [
            { pattern: /(^\$\(\([\s\S]+)\)\)/, lookbehind: !0 },
            /^\$\(\(/,
          ],
          number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
          operator:
            /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
          punctuation: /\(\(?|\)\)?|,|;/,
        },
      },
      {
        pattern: /\$\([^)]+\)|`[^`]+`/,
        inside: { variable: /^\$\(|^`|\)$|`$/ },
      },
      /\$(?:[a-z0-9_#\?\*!@]+|\{[^}]+\})/i,
    ],
  };
  e.languages.bash = {
    shebang: {
      pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/,
      alias: "important",
    },
    comment: { pattern: /(^|[^"{\\])#.*/, lookbehind: !0 },
    string: [
      {
        pattern:
          /((?:^|[^<])<<\s*)(?:"|')?(\w+?)(?:"|')?\s*\r?\n(?:[\s\S])*?\r?\n\2/g,
        lookbehind: !0,
        greedy: !0,
        inside: t,
      },
      { pattern: /(["'])(?:\\\\|\\?[^\\])*?\1/g, greedy: !0, inside: t },
    ],
    variable: t.variable,
    function: {
      pattern:
        /(^|\s|;|\||&)(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|npm|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)(?=$|\s|;|\||&)/,
      lookbehind: !0,
    },
    keyword: {
      pattern:
        /(^|\s|;|\||&)(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|\s|;|\||&)/,
      lookbehind: !0,
    },
    boolean: {
      pattern: /(^|\s|;|\||&)(?:true|false)(?=$|\s|;|\||&)/,
      lookbehind: !0,
    },
    operator: /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
    punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];]/,
  };
  var a = t.variable[1].inside;
  (a["function"] = e.languages.bash["function"]),
    (a.keyword = e.languages.bash.keyword),
    (a.boolean = e.languages.bash.boolean),
    (a.operator = e.languages.bash.operator),
    (a.punctuation = e.languages.bash.punctuation);
})(Prism);
!(function (e) {
  var t = /#(?!\{).+/,
    n = { pattern: /#\{[^}]+\}/, alias: "variable" };
  (e.languages.coffeescript = e.languages.extend("javascript", {
    comment: t,
    string: [
      { pattern: /'(?:\\?[^\\])*?'/, greedy: !0 },
      { pattern: /"(?:\\?[^\\])*?"/, greedy: !0, inside: { interpolation: n } },
    ],
    keyword:
      /\b(and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
    "class-member": { pattern: /@(?!\d)\w+/, alias: "variable" },
  })),
    e.languages.insertBefore("coffeescript", "comment", {
      "multiline-comment": { pattern: /###[\s\S]+?###/, alias: "comment" },
      "block-regex": {
        pattern: /\/{3}[\s\S]*?\/{3}/,
        alias: "regex",
        inside: { comment: t, interpolation: n },
      },
    }),
    e.languages.insertBefore("coffeescript", "string", {
      "inline-javascript": {
        pattern: /`(?:\\?[\s\S])*?`/,
        inside: {
          delimiter: { pattern: /^`|`$/, alias: "punctuation" },
          rest: e.languages.javascript,
        },
      },
      "multiline-string": [
        { pattern: /'''[\s\S]*?'''/, greedy: !0, alias: "string" },
        {
          pattern: /"""[\s\S]*?"""/,
          greedy: !0,
          alias: "string",
          inside: { interpolation: n },
        },
      ],
    }),
    e.languages.insertBefore("coffeescript", "keyword", {
      property: /(?!\d)\w+(?=\s*:(?!:))/,
    }),
    delete e.languages.coffeescript["template-string"];
})(Prism);
(Prism.languages.go = Prism.languages.extend("clike", {
  keyword:
    /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
  builtin:
    /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
  boolean: /\b(_|iota|nil|true|false)\b/,
  operator:
    /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
  number: /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
  string: { pattern: /("|'|`)(\\?.|\r|\n)*?\1/, greedy: !0 },
})),
  delete Prism.languages.go["class-name"];
(Prism.languages.java = Prism.languages.extend("clike", {
  keyword:
    /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
  number:
    /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
  operator: {
    pattern:
      /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
    lookbehind: !0,
  },
})),
  Prism.languages.insertBefore("java", "function", {
    annotation: {
      alias: "punctuation",
      pattern: /(^|[^.])@\w+/,
      lookbehind: !0,
    },
  });
(Prism.languages.php = Prism.languages.extend("clike", {
  keyword:
    /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
  constant: /\b[A-Z0-9_]{2,}\b/,
  comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: !0 },
})),
  Prism.languages.insertBefore("php", "class-name", {
    "shell-comment": {
      pattern: /(^|[^\\])#.*/,
      lookbehind: !0,
      alias: "comment",
    },
  }),
  Prism.languages.insertBefore("php", "keyword", {
    delimiter: { pattern: /\?>|<\?(?:php|=)?/i, alias: "important" },
    variable: /\$\w+\b/i,
    package: {
      pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
      lookbehind: !0,
      inside: { punctuation: /\\/ },
    },
  }),
  Prism.languages.insertBefore("php", "operator", {
    property: { pattern: /(->)[\w]+/, lookbehind: !0 },
  }),
  Prism.languages.markup &&
    (Prism.hooks.add("before-highlight", function (e) {
      "php" === e.language &&
        /(?:<\?php|<\?)/gi.test(e.code) &&
        ((e.tokenStack = []),
        (e.backupCode = e.code),
        (e.code = e.code.replace(
          /(?:<\?php|<\?)[\s\S]*?(?:\?>|$)/gi,
          function (a) {
            return e.tokenStack.push(a), "___PHP" + e.tokenStack.length + "___";
          }
        )),
        (e.grammar = Prism.languages.markup));
    }),
    Prism.hooks.add("before-insert", function (e) {
      "php" === e.language &&
        e.backupCode &&
        ((e.code = e.backupCode), delete e.backupCode);
    }),
    Prism.hooks.add("after-highlight", function (e) {
      if ("php" === e.language && e.tokenStack) {
        e.grammar = Prism.languages.php;
        for (var a, n = 0; (a = e.tokenStack[n]); n++)
          e.highlightedCode = e.highlightedCode.replace(
            "___PHP" + (n + 1) + "___",
            '<span class="token php language-php">' +
              Prism.highlight(a, e.grammar, "php").replace(/\$/g, "$$$$") +
              "</span>"
          );
        e.element.innerHTML = e.highlightedCode;
      }
    }));
Prism.languages.python = {
  "triple-quoted-string": {
    pattern: /"""[\s\S]+?"""|'''[\s\S]+?'''/,
    alias: "string",
  },
  comment: { pattern: /(^|[^\\])#.*/, lookbehind: !0 },
  string: { pattern: /("|')(?:\\\\|\\?[^\\\r\n])*?\1/, greedy: !0 },
  function: {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g,
    lookbehind: !0,
  },
  "class-name": { pattern: /(\bclass\s+)[a-z0-9_]+/i, lookbehind: !0 },
  keyword:
    /\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\b/,
  boolean: /\b(?:True|False)\b/,
  number:
    /\b-?(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
  operator:
    /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]|\b(?:or|and|not)\b/,
  punctuation: /[{}[\];(),.:]/,
};
!(function (e) {
  (e.languages.sass = e.languages.extend("css", {
    comment: {
      pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m,
      lookbehind: !0,
    },
  })),
    e.languages.insertBefore("sass", "atrule", {
      "atrule-line": {
        pattern: /^(?:[ \t]*)[@+=].+/m,
        inside: { atrule: /(?:@[\w-]+|[+=])/m },
      },
    }),
    delete e.languages.sass.atrule;
  var a = /((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i,
    t = [
      /[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/,
      { pattern: /(\s+)-(?=\s)/, lookbehind: !0 },
    ];
  e.languages.insertBefore("sass", "property", {
    "variable-line": {
      pattern: /^[ \t]*\$.+/m,
      inside: { punctuation: /:/, variable: a, operator: t },
    },
    "property-line": {
      pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
      inside: {
        property: [
          /[^:\s]+(?=\s*:)/,
          { pattern: /(:)[^:\s]+/, lookbehind: !0 },
        ],
        punctuation: /:/,
        variable: a,
        operator: t,
        important: e.languages.sass.important,
      },
    },
  }),
    delete e.languages.sass.property,
    delete e.languages.sass.important,
    delete e.languages.sass.selector,
    e.languages.insertBefore("sass", "punctuation", {
      selector: {
        pattern:
          /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
        lookbehind: !0,
      },
    });
})(Prism);
(Prism.languages.scss = Prism.languages.extend("css", {
  comment: { pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/, lookbehind: !0 },
  atrule: {
    pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
    inside: { rule: /@[\w-]+/ },
  },
  url: /(?:[-a-z]+-)*url(?=\()/i,
  selector: {
    pattern:
      /(?=\S)[^@;\{\}\(\)]?([^@;\{\}\(\)]|&|#\{\$[-_\w]+\})+(?=\s*\{(\}|\s|[^\}]+(:|\{)[^\}]+))/m,
    inside: {
      parent: { pattern: /&/, alias: "important" },
      placeholder: /%[-_\w]+/,
      variable: /\$[-_\w]+|#\{\$[-_\w]+\}/,
    },
  },
})),
  Prism.languages.insertBefore("scss", "atrule", {
    keyword: [
      /@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
      { pattern: /( +)(?:from|through)(?= )/, lookbehind: !0 },
    ],
  }),
  (Prism.languages.scss.property = {
    pattern: /(?:[\w-]|\$[-_\w]+|#\{\$[-_\w]+\})+(?=\s*:)/i,
    inside: { variable: /\$[-_\w]+|#\{\$[-_\w]+\}/ },
  }),
  Prism.languages.insertBefore("scss", "important", {
    variable: /\$[-_\w]+|#\{\$[-_\w]+\}/,
  }),
  Prism.languages.insertBefore("scss", "function", {
    placeholder: { pattern: /%[-_\w]+/, alias: "selector" },
    statement: { pattern: /\B!(?:default|optional)\b/i, alias: "keyword" },
    boolean: /\b(?:true|false)\b/,
    null: /\bnull\b/,
    operator: {
      pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
      lookbehind: !0,
    },
  }),
  (Prism.languages.scss.atrule.inside.rest = Prism.util.clone(
    Prism.languages.scss
  ));
(Prism.languages.swift = Prism.languages.extend("clike", {
  string: {
    pattern:
      /("|')(\\(?:\((?:[^()]|\([^)]+\))+\)|\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
    inside: {
      interpolation: {
        pattern: /\\\((?:[^()]|\([^)]+\))+\)/,
        inside: { delimiter: { pattern: /^\\\(|\)$/, alias: "variable" } },
      },
    },
  },
  keyword:
    /\b(as|associativity|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic(?:Type)?|else|enum|extension|fallthrough|final|for|func|get|guard|if|import|in|infix|init|inout|internal|is|lazy|left|let|mutating|new|none|nonmutating|operator|optional|override|postfix|precedence|prefix|private|Protocol|public|repeat|required|rethrows|return|right|safe|self|Self|set|static|struct|subscript|super|switch|throws?|try|Type|typealias|unowned|unsafe|var|weak|where|while|willSet|__(?:COLUMN__|FILE__|FUNCTION__|LINE__))\b/,
  number:
    /\b([\d_]+(\.[\de_]+)?|0x[a-f0-9_]+(\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,
  constant: /\b(nil|[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,
  atrule:
    /@\b(IB(?:Outlet|Designable|Action|Inspectable)|class_protocol|exported|noreturn|NS(?:Copying|Managed)|objc|UIApplicationMain|auto_closure)\b/,
  builtin:
    /\b([A-Z]\S+|abs|advance|alignof(?:Value)?|assert|contains|count(?:Elements)?|debugPrint(?:ln)?|distance|drop(?:First|Last)|dump|enumerate|equal|filter|find|first|getVaList|indices|isEmpty|join|last|lexicographicalCompare|map|max(?:Element)?|min(?:Element)?|numericCast|overlaps|partition|print(?:ln)?|reduce|reflect|reverse|sizeof(?:Value)?|sort(?:ed)?|split|startsWith|stride(?:of(?:Value)?)?|suffix|swap|toDebugString|toString|transcode|underestimateCount|unsafeBitCast|with(?:ExtendedLifetime|Unsafe(?:MutablePointers?|Pointers?)|VaList))\b/,
})),
  (Prism.languages.swift.string.inside.interpolation.inside.rest =
    Prism.util.clone(Prism.languages.swift));
