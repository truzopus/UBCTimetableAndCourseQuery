/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    query.WHERE = {};
    query.OPTIONS = {};
    query.OPTIONS.COLUMNS = [];
    let id = document.getElementsByClassName("tab-panel active")[0].getAttribute("data-type");
    let conditions = document.getElementById("tab-" + id).getElementsByClassName("conditions-container")[0];
    if (conditions.childNodes.length === 1) {
        let not = conditions.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
        let temp = conditions.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0];
        let field = temp.options[temp.selectedIndex].value;
        let temp2 = conditions.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0];
        let operator = temp2.options[temp2.selectedIndex].value;
        let val = conditions.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
        if (operator !== "IS" && !isNaN(val)) {
            val = Number(val);
        }
        if (not) {
            let json = {};
            json[id + "_" + field] = val;
            if (document.getElementById(id + "-conditiontype-none").checked) {
                query.WHERE.NOT = {};
                query.WHERE.NOT.NOT = {};
                query.WHERE.NOT.NOT[operator] = json;
            } else {
                query.WHERE.NOT = {};
                query.WHERE.NOT[operator] = json;
            }
        } else {
            if (document.getElementById(id + "-conditiontype-none").checked) {
                query.WHERE.NOT = {};
                query.WHERE.NOT[operator] = {};
                query.WHERE.NOT[operator][id + "_" + field] = val;
            } else {
                query.WHERE[operator] = {};
                query.WHERE[operator][id + "_" + field] = val;
            }
        }
    }
    if (conditions.childNodes.length > 1) {
        if (document.getElementById(id + "-conditiontype-all").checked) {
            query.WHERE.AND = [];
            for (let key of conditions.childNodes) {
                let not = key.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
                let temp = key.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0];
                let field = temp.options[temp.selectedIndex].value;
                let temp2 = key.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0];
                let operator = temp2.options[temp2.selectedIndex].value;
                let val = key.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
                if (operator !== "IS" && !isNaN(val)) {
                    val = Number(val);
                }
                if (not) {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    let json3 = {NOT:json2};
                    query.WHERE.AND.push(json3);
                } else {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    query.WHERE.AND.push(json2);
                }
            }
        } else if (document.getElementById(id + "-conditiontype-any").checked) {
            query.WHERE.OR = [];
            for (let key of conditions.childNodes) {
                let not = key.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
                let temp = key.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0];
                let field = temp.options[temp.selectedIndex].value;
                let temp2 = key.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0];
                let operator = temp2.options[temp2.selectedIndex].value;
                let val = key.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
                if (operator !== "IS" && !isNaN(val)) {
                    val = Number(val);
                }
                if (not) {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    let json3 = {NOT:json2};
                    query.WHERE.OR.push(json3);
                } else {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    query.WHERE.OR.push(json2);
                }
            }
        } else if (document.getElementById(id + "-conditiontype-none").checked) {
            query.WHERE.NOT = {};
            query.WHERE.NOT.OR = [];
            for (let key of conditions.childNodes) {
                let not = key.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
                let temp = key.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0];
                let field = temp.options[temp.selectedIndex].value;
                let temp2 = key.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0];
                let operator = temp2.options[temp2.selectedIndex].value;
                let val = key.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
                if (operator !== "IS" && !isNaN(val)) {
                    val = Number(val);
                }
                if (not) {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    let json3 = {NOT:json2};
                    query.WHERE.NOT.OR.push(json3);
                } else {
                    let json = {};
                    json[id + "_" + field] = val;
                    let json2 = {};
                    json2[operator] = json;
                    query.WHERE.NOT.OR.push(json2);
                }
            }
        }
    }
    let column = document.getElementById("tab-" + id).getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0].getElementsByClassName("control field");
    for (let key of column) {
        if (key.getElementsByTagName("input")[0].checked) {
            query.OPTIONS.COLUMNS.push(id + "_" + key.getElementsByTagName("input")[0].value);
        }
    }
    let transColumn = document.getElementById("tab-" + id).getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0].getElementsByClassName("control transformation");
    for (let key of transColumn) {
        if (key.getElementsByTagName("input")[0].checked) {
            query.OPTIONS.COLUMNS.push(key.getElementsByTagName("input")[0].value);
        }
    }
    let order = document.getElementById("tab-" + id).getElementsByClassName("form-group order")[0].getElementsByClassName("control-group")[0].getElementsByClassName("control order fields")[0].getElementsByTagName("select")[0];
    let orderS = [];
    let down = document.getElementById("tab-" + id).getElementsByClassName("form-group order")[0].getElementsByClassName("control-group")[0].getElementsByClassName("control descending")[0].getElementsByTagName("input")[0].checked;
    for (let key of order) {
        if (key.selected && key.className === "transformation") {
            orderS.push(key.value);
        } else if (key.selected) {
            orderS.push(id + "_" + key.value);
        }
    }
    if (orderS.length === 1) {
        if (!down) {
            query.OPTIONS.ORDER = orderS[0];
        } else if (down) {
            query.OPTIONS.ORDER = {};
            query.OPTIONS.ORDER.dir = "DOWN";
            query.OPTIONS.ORDER.keys = [];
            query.OPTIONS.ORDER.keys.push(orderS[0]);
        }
    } else if (orderS.length > 1) {
        query.OPTIONS.ORDER = {};
        query.OPTIONS.ORDER.keys = [];
        for (let key of orderS) {
            query.OPTIONS.ORDER.keys.push(key);
        }
        if (!down) {
            query.OPTIONS.ORDER.dir = "UP";
        } else {
            query.OPTIONS.ORDER.dir = "DOWN";
        }
    }
    let group = document.getElementById("tab-" + id).getElementsByClassName("form-group groups")[0].getElementsByClassName("control-group")[0].getElementsByClassName("control field");
    for (let key of group) {
        if (key.getElementsByTagName("input")[0].checked) {
            query.TRANSFORMATIONS = {};
            query.TRANSFORMATIONS.GROUP = [];
            break;
        }
    }
    for (let key of group) {
        if (key.getElementsByTagName("input")[0].checked) {
            query.TRANSFORMATIONS.GROUP.push(id + "_" + key.getElementsByTagName("input")[0].value);
        }
    }
    let transformations = document.getElementById("tab-" + id).getElementsByClassName("form-group transformations")[0].getElementsByClassName("transformations-container")[0].childNodes;
    if (transformations.length > 0) {
        query.TRANSFORMATIONS.APPLY = [];
        for (let key of transformations) {
            let term = key.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
            let temp = key.getElementsByClassName("control operators")[0].getElementsByTagName("select")[0];
            let operators = temp.options[temp.selectedIndex].value;
            let temp2 = key.getElementsByClassName("control fields")[0].getElementsByTagName("select")[0];
            let field = temp2.options[temp2.selectedIndex].value;
            let json = {}, json2 = {};
            json[operators] = id + "_" + field;
            json2[term] = json;
            query.TRANSFORMATIONS.APPLY.push(json2);
        }
    }
    return query;
};
