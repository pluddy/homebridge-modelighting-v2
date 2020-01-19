var dmx2pct = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 23, 23, 23, 24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 28, 28, 28, 29, 29, 30, 30, 30, 31, 31, 32, 32, 32, 33, 33, 34, 34, 34, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38, 39, 39, 40, 40, 40, 41, 41, 42, 42, 42, 43, 43, 44, 44, 44, 45, 45, 46, 46, 46, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 51, 51, 51, 52, 52, 53, 53, 53, 54, 54, 55, 55, 55, 56, 56, 57, 57, 57, 58, 58, 59, 59, 59, 60, 60, 61, 61, 61, 62, 62, 62, 63, 63, 63, 64, 64, 65, 65, 65, 66, 66, 67, 67, 67, 68, 68, 69, 69, 69, 70, 70, 71, 71, 71, 72, 72, 73, 73, 73, 74, 74, 74, 75, 75, 76, 76, 76, 77, 77, 78, 78, 79, 79, 79, 80, 80, 80, 81, 81, 82, 82, 82, 83, 83, 84, 84, 84, 85, 85, 86, 86, 86, 87, 87, 87, 88, 88, 88, 89, 89, 90, 90, 90, 91, 91, 92, 92, 92, 93, 93, 94, 94, 94, 95, 95, 96, 96, 96, 97, 97, 98, 98, 98, 99, 99, 100, 100];
var pct2dmx = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45, 47, 50, 52, 55, 57, 60, 63, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88, 90, 93, 96, 99, 101, 104, 106, 109, 111, 114, 116, 119, 121, 124, 127, 129, 132, 134, 137, 139, 142, 144, 147, 149, 152, 154, 157, 160, 163, 165, 168, 170, 173, 175, 178, 180, 183, 185, 188, 191, 193, 196, 198, 201, 203, 206, 208, 211, 213, 216, 218, 221, 224, 227, 229, 232, 234, 237, 239, 242, 244, 247, 249, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];
function _(a) {
    return eDIN_strings ? eDIN_strings[a] || a : a
}
function get_version() {
    return _("WebApplicationVersionNumber")
}
function edin_log() {
    window.console && console.log.apply(this, arguments)
}
function _(a) {
    return eDIN_strings ? eDIN_strings[a] || a : a
}
function xmlencode(a) {
    if (a == null) {
        a = ""
    }
    a = a.toString();
    if (a.indexOf("<![CDATA[") == -1) {
        return a.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    } else {
        return a
    }
}
function getxml(a, b) {
    return $.ajax({
        type: "GET",
        url: a,
        contentType: "application/xml;",
        dataType: "xml",
        success: b
    })
}
function getbin(a, b) {
    return $.ajax({
        type: "GET",
        url: a,
        contentType: "text/plain;",
        dataType: "text",
        success: b
    })
}
function postxml(a, b, c) {
    if ($.isFunction(b)) {
        return $.ajax({
            type: "POST",
            url: a,
            contentType: "application/xml;",
            dataType: "xml",
            success: b
        })
    } else {
        return $.ajax({
            type: "POST",
            url: a,
            data: b,
            contentType: "application/xml;",
            dataType: "xml",
            success: c
        })
    }
}
function xmlrtc(a, b) {
    $.ajax({
        type: "GET",
        url: "/xml-rpc?invoke=getRTC",
        dataType: "text",
        success: a,
        timeout: 5000,
        error: function() {
            if (b) {
                b()
            }
        }
    })
}
function xmlcall(c, a) {
    var d = ["<methodCall>\r<methodName>", xmlencode(a), "</methodName>"];
    if (arguments.length > 2) {
        d.push("<params>");
        for (var b = 2; b < arguments.length; b++) {
            d.push("<param>", xmlencode(arguments[b]), "</param>")
        }
        d.push("</params>")
    }
    d.push("</methodCall>");
    xmldocall(c, d.join(""))
}
function xmldocall(a, c) {
    var b = ['<?xml version="1.0"?>', c];
    postxml("/xml-rpc?", b.join(""), a)
}
var ajaxQueue = [];
var ajaxLocked = false;
function xmlqueuedcall(a, b) {
    ajaxQueue.push([a, b]);
    xmlpopcall()
}
function xmlpopcall() {
    if (!ajaxLocked && (ajaxQueue.length != 0)) {
        var a = ajaxQueue.shift();
        ajaxLocked = true;
        $.ajax({
            type: "POST",
            url: "/xml-rpc?",
            data: a[1],
            contentType: "application/xml;",
            dataType: "xml",
            success: function(b) {
                ajaxLocked = false;
                xmlpopcall();
                if (a[0]) {
                    a[0](b)
                }
            }
        })
    }
}
function xmlbuildcall(a) {
    var c = ["<methodCall>\r<methodName>", xmlencode(a), "</methodName>"];
    if (arguments.length > 1) {
        c.push("<params>");
        for (var b = 1; b < arguments.length; b++) {
            c.push("<param>", xmlencode(arguments[b]), "</param>")
        }
        c.push("</params>")
    }
    c.push("</methodCall>");
    return c.join("")
}
var xmlinvoke_mapping = [null, null, "invokeObject", "invokeObjectUnary", "invokeObjectBinary", "invokeObjectTernary", "invokeObjectQuaternary"];
function xmlinvoke(b, c) {
    var a = xmlinvoke_mapping[arguments.length];
    if (a) {
        var e = ["<methodCall>\r<methodName>", xmlencode(a), "</methodName>"];
        e.push("<params>");
        e.push("<param>", xmlencode(b), "</param>");
        e.push("<param>", xmlencode(c), "</param>");
        for (var d = 2; d < arguments.length; d++) {
            e.push("<param>", xmlencode(arguments[d]), "</param>")
        }
        e.push("</params>");
        e.push("</methodCall>");
        return e.join("")
    }
    return ""
}
function xmlget(b, a) {
    getxml("/xml-dump?nocrlf=true&what=configuration&where=" + b, a)
}
function binget(b, a) {
    getbin("/bin-dump?what=configuration&where=" + b, a)
}
function xmlget_modal(b, a) {
    if (a) {
        $.ajax({
            type: "GET",
            async: false,
            url: ["/xml-dump?what=configuration&where=", b].join(""),
            contentType: "application/xml;",
            dataType: "xml",
            success: a
        })
    } else {
        $.ajax({
            type: "GET",
            async: false,
            url: ["/xml-dump?what=configuration&where=", b].join(""),
            contentType: "application/xml;",
            dataType: "xml"
        })
    }
}
function xmlenv(b, a) {
    getxml(a ? "/xml-env?what=set&config=" + a : "/xml-env?what=get", b)
}
function xmlclock(a) {
    getxml("/xml-env?what=clock", a)
}
function xmltzinfo(a, b) {
    getxml("/xml-tzinfo?what=" + b, a)
}
function xmlgetuser(a) {
    getxml("/xml-dump?nocrlf=true&what=user&where=/", a)
}
function xmlstats(a) {
    getxml("/xml-env?what=stats", a)
}
function xmlgetstatus(b, a) {
    getxml("/xml-dump?nocrlf=true&what=status&where=" + b, a)
}
function bingetstatus(b, a) {
    getbin("/bin-dump?what=status&where=" + b, a)
}
function xmlpollstatusex(c, a, b) {
    $.ajax({
        type: "GET",
        url: "/xml-dump?nocrlf=true&longpoll=" + a + "&what=status&where=" + c,
        contentType: "application/xml;",
        dataType: "xml",
        timeout: 10000000,
        success: function(d) {
            if (b) {
                b(d)
            }
        }
    })
}
function binpollstatusex(c, a, b) {
    setTimeout(function() {
        $.ajax({
            type: "GET",
            url: "/bin-dump?longpoll=" + a + "&what=status&where=" + c,
            contentType: "text/plain;",
            dataType: "text",
            timeout: 10000000,
            success: function(d) {
                if (b) {
                    b(d)
                }
            },
            error: function() {
                binpollstatusex(c, a, b)
            }
        })
    }, 0)
}
function xmlpollstatus(b, a) {
    xmlpollstatusex(b, 100, a)
}
function binpollstatus(b, a) {
    binpollstatusex(b, 100, a)
}
function eDIN_refreshStatus(a) {
    xmlgetstatus("/", a)
}
function eDIN_refreshData(a) {
    xmlget("/", a)
}
function validateLogin(a, b, c) {
    eDIN_login(a, b, c);
    window.parent.parent.location.href = "/"
}
function eDIN_login(a, c, e, d) {
    if (a != "" || c != "") {
        document.cookie = ["Authorization=Basic ", btoa(a + ":" + c), e ? "; max-age=999999999" : ""].join("")
    } else {
        var b = new Date();
        b.setTime(b.getTime() - (24 * 60 * 60 * 1000));
        document.cookie = "Authorization= ; expires=" + b.toGMTString() + ";"
    }
    $.ajax({
        type: "GET",
        url: "logoff",
        dataType: "xml",
        username: a,
        password: c,
        success: d,
        error: d
    })
}
function eDIN_logoffComplete(b, a) {
    window.location = _("/logoff.html")
}
function eDIN_logoff() {
    document.cookie = "Authorization=None; max-age=0";
    $.ajax({
        type: "GET",
        url: "logoff",
        dataType: "xml",
        username: "nobody",
        password: "here",
        complete: eDIN_logoffComplete
    })
}
logoff = eDIN_logoff;
function eDIN_energyRating(a) {
    if (a > 94) {
        return "a"
    } else {
        if ((a > 75) && (a < 95)) {
            return "b"
        } else {
            if ((a > 50) && (a < 76)) {
                return "c"
            } else {
                if ((a > 19) && (a < 51)) {
                    return "d"
                } else {
                    if ((a > 9) && (a < 20)) {
                        return "e"
                    } else {
                        if ((a > 5) && (a < 10)) {
                            return "f"
                        } else {
                            return "g"
                        }
                    }
                }
            }
        }
    }
}
function eDIN_energyStatus(a) {
    if (a > 94) {
        return "e_darkgreen.png"
    } else {
        if ((a > 75) && (a < 95)) {
            return "e_green.png"
        } else {
            if ((a > 50) && (a < 76)) {
                return "e_lime.png"
            } else {
                if ((a > 19) && (a < 51)) {
                    return "e_yellow.png"
                } else {
                    if ((a > 9) && (a < 20)) {
                        return "e_amber.png"
                    } else {
                        if ((a > 5) && (a < 10)) {
                            return "e_orange.png"
                        } else {
                            return "e_red.png"
                        }
                    }
                }
            }
        }
    }
}
function eDIN_energyStatusSmall(a) {
    if (a > 94) {
        return "e_darkgreen_small.png"
    } else {
        if ((a > 75) && (a < 95)) {
            return "e_green_small.png"
        } else {
            if ((a > 50) && (a < 76)) {
                return "e_lime_small.png"
            } else {
                if ((a > 19) && (a < 51)) {
                    return "e_yellow_small.png"
                } else {
                    if ((a > 9) && (a < 20)) {
                        return "e_amber_small.png"
                    } else {
                        if ((a > 5) && (a < 10)) {
                            return "e_orange_small.png"
                        } else {
                            return "e_red.png"
                        }
                    }
                }
            }
        }
    }
}
var Jan_1_2000 = 2451545;
var Jan_1_1970 = 2440588;
var MAX_DATE = Jan_1_2000 + 49170;
function makeTimeStamp(a, b) {
    return ((a < MAX_DATE ? a - Jan_1_2000 : 49170) * 86400) + (b % 86400)
}
function splitTimeStamp(a) {
    return {
        date: dateOf(a),
        time: timeOf(a)
    }
}
function timeOf(a) {
    return a % 86400
}
function dateOf(a) {
    return ((a - timeOf(a)) / 86400) + Jan_1_2000
}
function makeDate(c, g, e) {
    var f = 1;
    if (e <= 1585) {
        f = 0
    }
    var b = -1 * Math.floor(7 * (Math.floor((g + 9) / 12) + e) / 4);
    var d = 1;
    if ((g - 9) < 0) {
        d = -1
    }
    var a = Math.abs(g - 9);
    var h = Math.floor(e + d * Math.floor(a / 7));
    h = -1 * Math.floor((Math.floor(h / 100) + 1) * 3 / 4);
    b = b + Math.floor(275 * g / 9) + c + (f * h);
    b = b + 1721027 + 2 * f + 367 * e;
    return b
}
function splitDate(d) {
    var a = Math.floor(d + 68569);
    var f = Math.floor(4 * a / 146097);
    a = a - Math.floor((146097 * f + 3) / 4);
    var e = Math.floor(4000 * (a + 1) / 1461001);
    a = a - Math.floor(1461 * e / 4) + 31;
    var c = Math.floor(80 * a / 2447);
    var b = a - Math.floor(2447 * c / 80);
    a = Math.floor(c / 11);
    c = c + 2 - 12 * a;
    e = 100 * (f - 49) + e + a;
    return {
        day: b,
        month: c,
        year: e
    }
}
function makeTime(a, c, b) {
    return ((a * 60) + c) * 60 + b
}
function splitTime(c) {
    var b = c % 60;
    c = (c - b) / 60;
    var a = c % 60;
    c = (c - a) / 60;
    return {
        hour: c,
        minute: a,
        second: b
    }
}
function eDIN_time2str(c) {
    var a = "";
    if (c < 0) {
        a = "-";
        c = -c
    }
    var d = c % 60;
    c = (c - d) / 60;
    var b = c % 60;
    c = (c - b) / 60;
    return (c < 10 ? "0" : "") + c + ":" + (b < 10 ? "0" : "") + b + ":" + (d < 10 ? "0" : "") + d
}
function eDIN_offset2str(c) {
    var b = c < 0;
    c = Math.abs(c);
    var a = c % 60;
    c = (c - a) / 60;
    return (b ? "-" : "+") + (c < 10 ? "0" : "") + c + ":" + (a < 10 ? "0" : "") + a
}
function eDIN_str2offset(b) {
    var a = b.match(/\d+/g);
    return ((a[0] - 0) * 60 + (a[1] - 0)) * ((b[0] == "-") ? -1 : 1)
}
function eDIN_date2str(a) {
    var b = splitDate(a);
    return (b.day < 10 ? "0" : "") + b.day + "/" + (b.month < 10 ? "0" : "") + b.month + "/" + b.year
}
function eDIN_timestamp2str(a) {
    return eDIN_date2str(dateOf(a)) + " " + eDIN_time2str(timeOf(a))
}
function eDIN_str2time(e) {
    var b = 1;
    e = e.split(":");
    if (e[0].charAt(0) == "-") {
        b = -1
    }
    var a = Math.abs(e[0] || 0);
    var c = e[1] || 0;
    var d = e[2] || 0;
    a = a - 0;
    return b * (a * 3600 + (c - 0) * 60 + (d - 0))
}
function escapeHTML(a) {
    return (a + "").replace(/&/gmi, "&amp;").replace(/'/gmi, "&apos;").replace(/"/gmi, "&quot;").replace(/>/gmi, "&gt;").replace(/</gmi, "&lt;")
}
function replaceHTML(el, html) {
    var oldEl = typeof el === "string" ? document.getElementById(el) : el;
    /*@cc_on // Pure innerHTML is slightly faster in IE
		oldEl.innerHTML = html;
		return oldEl;
	@*/
    var newEl = oldEl.cloneNode(false);
    newEl.innerHTML = html;
    oldEl.parentNode.replaceChild(newEl, oldEl);
    return newEl
}
function eDIN_defaultCloseDialogFn() {
    $(this).dialog("destroy").remove()
}
function eDIN_openDialog(b, d, f, e, c, a) {
    var g = {};
    g[_("Ok")] = f || eDIN_defaultCloseDialogFn;
    g[_("Cancel")] = e || eDIN_defaultCloseDialogFn;
    $(d).appendTo("body").dialog({
        modal: true,
        resizable: false,
        width: "70%",
        height: "auto",
        position: "center",
        buttons: g,
        close: e || eDIN_defaultCloseDialogFn,
        open: c || null,
        beforeClose: a || null
    })
}
function eDIN_defaultCloseLightDialogFn() {
    $("#edin-modal-dialog").remove()
}
function eDIN_openLightDialog(a, d, g, f, c) {
    eDIN_defaultCloseLightDialogFn();
    var b = $(d);
    var e = ["<div id='edin-modal-dialog' class='ui-dialog ui-widget ui-widget-content ui-corner-all ui-helper-hidden' style='width:70%;'>", "<div class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix'>", "<span class='ui-dialog-title'>", b.attr("title"), "</span>", "<a class='edin-live-button ui-dialog-titlebar-close ui-corner-all' href='javascript:void(0)'><span class='close ui-icon ui-icon-closethick'>close</span></a>", "</div>", "<div class='ui-dialog-content ui-widget-content'></div>", "<div class='ui-dialog-buttonpane ui-widget-content ui-helper-clearfix'>", "<button class='close edin-modal-dialog-ok edin-live-button ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'>", "<span class='ui-button-text'>", _("Ok"), "</span></button>", "<button class='close edin-modal-dialog-cancel edin-live-button ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only'>", "<span class='ui-button-text'>", _("Cancel"), "</span></button>", "</div>", "</div>"].join("");
    $(e).appendTo("body").find(".ui-dialog-content").html(b).end().find(".edin-modal-dialog-ok").click(g || eDIN_defaultCloseLightDialogFn).end().find(".edin-modal-dialog-cancel").click(f || eDIN_defaultCloseLightDialogFn).end().overlay({
        top: "5%",
        mask: {
            color: "#444",
            loadSpeed: 200,
            opacity: 0.9
        },
        closeOnClick: false,
        load: true,
        fixed: false,
        onClose: function() {
            $("#edin-modal-dialog").remove()
        }
    })
}
function eDIN_openAlertDialog(a, b, d) {
    var c = {};
    c[_("Close")] = d || eDIN_defaultCloseDialogFn;
    $(b).appendTo("body").dialog({
        modal: true,
        resizable: false,
        width: 714,
        height: "auto",
        position: "center",
        buttons: c,
        close: d || eDIN_defaultCloseDialogFn
    })
}
var eDIN_pluginScripts;
var eDIN_pluginScriptsInit;
function eDIN_MapPluginHooks(a, c, b) {
    eDIN_pluginScripts = new Array;
    eDIN_pluginScriptsInit = new Array;
    if (c) {
        $(a).find("Plugin").each(function() {
            var e = $(this);
            var d = e.attr("LoadId");
            e.find("http-entry-point").each(function() {
                var f = $(this);
                for (hookId in c) {
                    var j = c[hookId];
                    if (j) {
                        if (f.find("hookid").text() == hookId) {
                            var h = f.find(_("html_locale") + " name").text() || f.find("en name").text() || "";
                            var g = f.find(_("html_locale") + " href").text() || f.find("en href").text() || "";
                            if (g.indexOf("javascript:") != 0) {
                                var g = "/plugin/" + d + "/" + g
                            }
                            var i = "/plugin/" + d + "/" + f.find("icon").text();
                            j(h, g, i, d)
                        }
                    }
                }
            })
        })
    }
    if (eDIN_pluginScripts.length) {
        require(eDIN_pluginScripts, function() {
            var f;
            for (f = 0; f < eDIN_pluginScriptsInit.length; ++f) {
                var d = this[eDIN_pluginScriptsInit[f].name];
                if (typeof d === "function") {
                    try {
                        d(eDIN_pluginScriptsInit[f].loadId)
                    } catch (g) {}
                }
            }
            b = this[b];
            if (b) {
                b(a)
            }
        })
    } else {
        b = this[b];
        if (b) {
            b(a)
        }
    }
}
function eDIN_RegisterScript(c, b, d, a) {
    eDIN_pluginScripts.push(b);
    eDIN_pluginScriptsInit.push({
        name: c,
        loadId: a
    })
}
eDIN_POWERKEYS = {
    wattage: "#Wattage",
    state: "#State"
};
var eDIN_POWERCURVE = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12, 12, 13, 14, 15, 15, 16, 17, 18, 19, 20, 21, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 39, 40, 41, 43, 44, 45, 47, 48, 50, 51, 53, 54, 56, 58, 59, 61, 63, 64, 66, 68, 69, 71, 73, 75, 76, 78, 80, 82, 84, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 171, 173, 175, 177, 179, 180, 182, 184, 186, 187, 189, 191, 192, 194, 196, 197, 199, 201, 202, 204, 205, 207, 208, 210, 211, 212, 214, 215, 216, 218, 219, 220, 222, 223, 224, 225, 226, 227, 228, 230, 231, 232, 233, 234, 234, 235, 236, 237, 238, 239, 240, 240, 241, 242, 243, 243, 244, 245, 245, 246, 246, 247, 247, 248, 248, 249, 249, 250, 250, 250, 251, 251, 251, 252, 252, 252, 253, 253, 253, 253, 253, 254, 254, 254, 254, 254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255];
function eDIN_calculatePower(a) {
    if (a.PowerLevel == undefined) {
        return Math.ceil(a.Wattage * eDIN_POWERCURVE[a.CupLevel && (a.State <= a.CupLevel) ? 0 : a.State] / 255)
    } else {
        return Math.ceil(a.Wattage * a.PowerLevel / 255)
    }
}
var pageSetupFollowUpFn = null;
var pageRedirect = "A";
var isEvoConfiguration = false;
function __eDIN_pageSetup(e) {
    var f = $(e);
    var b = f.find("CreatedBy").text();
    isEvoConfiguration = !b.match(/eDIN Configuration.*/);
    var d = f.find("Role").text();
    var g = f.find("Username").text();
    var c = false;
    if (f.find("Empty").size() == 1) {
        d = "65";
        c = true
    }
    if (((pageRedirect == "A") && d != "65") || ((pageRedirect == "O") && ((d != "65") && (d != "79"))) || ((pageRedirect == "U") && ((d != "65") && (d != "79") && (d != "85")))) {
        window.location = "/"
    }
    if (!c) {
        $(".edin-icon-logoff").show()
    }
    if (d == "85") {
        $(".edin-icon-scenesettings").remove();
        $(".edin-icon-configure").remove();
        $(".edin-icon-monitor").remove();
        $(".edin-icon-settings").remove()
    } else {
        if (d == "79") {
            $(".edin-icon-configure").remove();
            $(".edin-icon-monitor").remove();
            $(".edin-icon-settings").remove()
        }
    }
    var a = d == "85" ? ["<ul>", "<li class='edin-nav-home'><a href='/", _("admin.html"), "'>", _("Home"), "</a></li>", "<li class='edin-nav-control'><a href='/", _("control.html"), "'>", _("Control"), "</a></li>", "<li class='edin-nav-logoff'><a href='javascript:logoff();'>", _("Logoff"), "</a></li>", "</ul>"] : d == "79" ? ["<ul>", "<li class='edin-nav-home'><a href='/", _("admin.html"), "'>", _("Home"), "</a></li>", "<li class='edin-nav-control'><a href='/", _("control.html"), "'>", _("Control"), "</a></li>", "<li class='edin-nav-scene'><a href='/", _("adjust.html"), "'>", _("Scene Settings"), "</a></li>", "<li class='edin-nav-logoff'><a href='javascript:logoff();'>", _("Logoff"), "</a></li>", "</ul>"] : c ? ["<ul>", "<li class='edin-nav-home'><a href='/", _("admin.html"), "'>", _("Home"), "</a></li>", "<li class='edin-nav-control'><a href='/", _("control.html"), "'>", _("Control"), "</a></li>", "<li class='edin-nav-scene'><a href='/", _("adjust.html"), "'>", _("Scene Settings"), "</a></li>", "<li class='edin-nav-configuration'><a href='/", _("configuration.html"), "'>", _("Configuration"), "</a></li>", "<li class='edin-nav-monitor'><a href='/", _("monitor.html"), "'>", _("Monitor"), "</a></li>", "<li class='edin-nav-settings'><a href='/", _("network.html"), "'>", _("Settings"), "</a></li>", "</ul>"] : ["<ul>", "<li class='edin-nav-home'><a href='/", _("admin.html"), "'>", _("Home"), "</a></li>", "<li class='edin-nav-control'><a href='/", _("control.html"), "'>", _("Control"), "</a></li>", "<li class='edin-nav-scene'><a href='/", _("adjust.html"), "'>", _("Scene Settings"), "</a></li>", "<li class='edin-nav-configuration'><a href='/", _("configuration.html"), "'>", _("Configuration"), "</a></li>", "<li class='edin-nav-monitor'><a href='/", _("monitor.html"), "'>", _("Monitor"), "</a></li>", "<li class='edin-nav-settings'><a href='/", _("network.html"), "'>", _("Settings"), "</a></li>", "<li class='edin-nav-logoff'><a href='javascript:logoff();'>", _("Logoff"), "</a></li>", "</ul>"];
    $("div.edin-banner-nav").html(a.join(""));
    if (pageSetupFollowUpFn) {
        pageSetupFollowUpFn(e);
        pageSetupFollowUpFn = null
    }
}
function eDIN_pageSetup(a, b) {
    pageSetupFollowUpFn = b;
    pageRedirect = a;
    xmlstats(__eDIN_pageSetup)
}
function __eDIN_pageRedirect(a) {
    if ($(a).find("Empty").size() == 1) {
        if (pageSetupFollowUpFn) {
            pageSetupFollowUpFn(a);
            pageSetupFollowUpFn = null
        }
    } else {
        window.location = "/"
    }
}
function eDIN_pageRedirect(a) {
    pageSetupFollowUpFn = a;
    xmlstats(__eDIN_pageRedirect)
}
var $loading = $("#loading");
var $window = $(window);
$loading.length && $loading.bind({
    ajaxStart: function() {
        $loading.css("top", $window.scrollTop()).css("display", "")
    },
    ajaxStop: function() {
        $loading.css("display", "none")
    }
});
var g_configuration = null;

