
export default class ExtractHtml {
    public static findNested(obj: any, key: any, value: any): object[] {
        // Base case
        if (obj[key] === value) {
            return obj;
        } else {
            for (let c in Object.keys(obj)) {
                let myKey = Object.keys(obj)[c];
                let objectValue = obj[myKey];
                if (myKey !== "parentNode" && typeof objectValue === "object") {
                    let found: any = this.findNested(obj[myKey], key, value);
                    if (found) {
                        return found;
                    }
                }
            }
        }
    }

    public static findNestedBuildingInfo(obj: any, roomSection: any[]): any[] {
        let div = this.findHelper(obj["childNodes"], "div");
        let divList: any[] = [];
        for (let i in div) {
            divList.push(div[i]["childNodes"]);
        }
        let divSubList: any[] = [];
        for (let j in divList) {
            let temp = this.findHelper(divList[j], "div");
            if (temp.length > 0) {
                for (let k in temp) {
                    divSubList.push(temp[k]);
                }
            }
        }
        let final: any[] = [];
        for (let i in divSubList) {
            let attrN = divSubList[i]["attrs"];
            for (let j in attrN) {
                let myKey = attrN[j]["name"];
                let myValue = attrN[j]["value"];
                if (myKey === "id" && myValue === "main") {
                    final.push(divSubList[i]);
                }
            }
        }
        let sect: any = this.findNested(final[0], "nodeName", "section");
        let sectDivCN: any[] = [];
        for (let i in Object.keys(sect["childNodes"])) {
            if (sect["childNodes"][i]["nodeName"] === "div") {
                let child = sect["childNodes"][i]["childNodes"];
                for (let j in child) {
                    if (child[j]["nodeName"] === "div") {
                        sectDivCN.push(child[j]);
                    }
                }
            }
        }
        let body: any[] = [];
        for (let i in sectDivCN) {
            let attrsCN = sectDivCN[i]["attrs"];
            if (attrsCN[0]["name"] === "class" && attrsCN[0]["value"] === "view-content") {
                body.push(sectDivCN[i]);
            } else if (attrsCN[0]["name"] === "class" && attrsCN[0]["value"] === "view-footer") {
                body.push(sectDivCN[i]);
            }
        }
        return body;
    }

    public static findHelper2(obj: any, key: string): any[] {
        let output: any[] = [];
        let cn = obj["childNodes"];
        for (let i in Object.keys(cn)) {
            if (cn[i]["nodeName"] === key) {
                output.push(cn[i]);
            }
        }
        return output;
    }

    public static findHelper(obj: any, key: string): any[] {
        let output: any[] = [];
        for (let i in Object.keys(obj)) {
            let myKey = Object.keys(obj)[i];
            if (obj[i]["nodeName"] === key && obj[i] !== undefined) {
                output.push(obj[myKey]);
            }
        }
        return output;
    }

    public static findNestedAtr(obj: any): any[] {
        let output = this.findHelper(obj, "tr");
        let final: any[] = [];
        for (let i in output) {
            let cn1 = output[i]["childNodes"];
            let cn1H = this.findHelper(cn1, "td");
            for (let is in Object.keys(cn1H)) {
                let temp = cn1H[is]["childNodes"];
                if (Object.keys(temp).length > 1) {
                    let a: any = this.findHelper(temp, "a");
                    if (Object.keys(a).length > 0) {
                        let hrefTemp: any = Object.values(a)[0];
                        let href = hrefTemp["attrs"][0]["value"];
                        final.push(href);
                    }
                }
            }
        }
        return final;
    }

    public static parseRoom(roominfo: any[], roomSection: any) {
        let body: any[] = roominfo[0]["childNodes"];
        let fieldContent: any[] = [];
        for (let i in body) {
            if (body[i]["nodeName"] === "div") {
                fieldContent = body[i]["childNodes"];
            }
        }
        let fCN: any[] = [];
        this.parseHelper(fieldContent, fCN, "div");
        let fCN2: any[] = [];
        this.checkAttr(fCN, "id", "building-info", fCN2);
        for (let i in fCN[0]["childNodes"]) {
            if (fCN[0]["childNodes"][i]["nodeName"] === "h2") {
                let span = fCN[0]["childNodes"][i]["childNodes"];
                roomSection["rooms_fullname"] = span[0]["childNodes"][0]["value"];
            }
        }
        let add: any[] = [];
        this.parseHelper(fCN2, add, "div");
        for (let i in add) {
            let addCN = add[i]["childNodes"];
            for (let j in addCN) {
                let addCN2 = addCN[j]["childNodes"];
                if (addCN2[0]["nodeName"] === "#text" && addCN2.length === 1
                    && !addCN2[0]["value"].includes("Building Hours")) {
                    roomSection["rooms_address"] = addCN2[0]["value"];
                    return;
                }
            }
        }
    }

    public static parseHelper(obj: any[], array: any[], key: string) {
        for (let j in obj) {
            let objCN = obj[j]["childNodes"];
            if (obj[j]["nodeName"] === key && objCN !== undefined) {
                let objSub = obj[j]["childNodes"];
                for (let i in objSub) {
                    if (objSub[i]["nodeName"] === key) {
                        array.push(objSub[i]);
                    }
                }
            }
        }
    }

    public static checkAttr(obj: any[], name: string, value: string, array: any[]) {
        for (let i in obj) {
            let attr = obj[i]["attrs"][0];
            if (attr["name"] === name && attr["value"] === value) {
                array.push(obj[i]);
            }
        }
    }

    public static parseTable(roominfo: any[]): [boolean, any[]] {
        let table: object = roominfo[1];
        let tableNode = this.findNested(table, "nodeName", "tbody");
        if (tableNode === undefined) {
            return [false, undefined];
        }
        let tr = this.findHelper2(tableNode, "tr");
        let List = this.parseTableHelper(tr);
        return [List.length > 0, List];
    }

    public static parseTableHelper2(tr: any): any[] {
        let td: any[] = [];
        for (let i in tr) {
            if (tr[i]["nodeName"] !== "#text") {
                let trChild = tr[i]["childNodes"];
                for (let j in trChild) {
                    let tds = trChild[j];
                    if (tds["nodeName"] !== "#text") {
                        td.push(tds);
                    }
                }
            }
        }
        return td;
    }

    public static parseTableHelper(tr: any[]): any[] {
        let href: any[] = [];
        let rNumber: any[] = [];
        let seats: any[] = [];
        let type: any[] = [];
        let furn: any[] = [];
        let rName: any[] = [];
        let sName: any[] = [];
        let td = this.parseTableHelper2(tr);
        for (let i in td) {
            let cap = td[i]["childNodes"];
            if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-number") {
                let tdA = td[i]["childNodes"];
                for (let a in tdA) {
                    if (tdA[a]["nodeName"] === "a") {
                        let h = tdA[a]["attrs"];
                        let link = this.getHref(h);
                        href.push(link);
                        let res = link.split("/");
                        let last = res[res.length - 1];
                        let l = last.split("-");
                        sName.push(l[0]);
                        let CN = tdA[a]["childNodes"];
                        rNumber.push(CN[0]["value"]);
                        rName.push(l[0] + "_" + CN[0]["value"]);
                    }
                }
            } else if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-capacity") {
                seats.push(Number(cap[0]["value"]));
            } else if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-furniture") {
                if (cap[0]["value"] !== undefined) {
                    let temp = String(cap[0]["value"]).replace("\n", "");
                    furn.push(temp.trim());
                } else {
                    furn.push("");
                }
            } else if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-type") {
                if (cap[0]["value"] !== undefined) {
                    let temp = String(cap[0]["value"]).replace("\n", "");
                    type.push(temp.trim());
                } else {
                    type.push("");
                }
            }
        }
        let combine = [href, rNumber, seats, type, furn, rName, sName];
        return combine;
    }

    public static getHref(array: any[]): string {
        for (let c in array) {
            if (array[c]["name"] === "href") {
                return array[c]["value"];
            }
        }
    }

    public static parseIndex(data: any): any[] {
        let parse5 = require("parse5");
        let indexTree = parse5.parse(data);
        let test: any = this.findNested(indexTree["childNodes"], "nodeName", "tbody");
        let contentTB = test["childNodes"];
        let indexTemp = this.findNestedAtr(contentTB);
        return [...new Set(indexTemp)];
    }

    public static pushDatafile(dataFile: any[], roomFile: any[], roomSection: any): void {
        for (let i in roomFile[1][0]) {
            let section: any = {};
            section["rooms_fullname"] = roomSection["rooms_fullname"];
            section["rooms_address"] = roomSection["rooms_address"];
            section["rooms_lat"] = roomSection["rooms_lat"];
            section["rooms_lon"] = roomSection["rooms_lon"];
            section["rooms_href"] = roomFile[1][0][i];
            section["rooms_number"] = roomFile[1][1][i];
            section["rooms_seats"] = roomFile[1][2][i];
            section["rooms_type"] = roomFile[1][3][i];
            section["rooms_furniture"] = roomFile[1][4][i];
            section["rooms_name"] = roomFile[1][5][i];
            section["rooms_shortname"] = roomFile[1][6][i];
            dataFile.push(section);
        }
    }
}
