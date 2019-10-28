
export default class ExtractHtml {
    public static findNested(obj: any, key: any, value: any): object[] {
        // Base case
        if (obj[key] === value) {
            return obj;
        } else {
            for (let i = 0, len = Object.keys(obj).length; i < len; i++) {
                let myKey = Object.keys(obj)[i];
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
        for (let i = 0, len = div.length; i < len; i++) {
            divList.push(div[i]["childNodes"]);
        }
        let divSubList: any[] = [];
        for (let j = 0, lens = divList.length; j < lens; j++) {
            let temp = this.findHelper(divList[j], "div");
            if (temp.length > 0) {
                for (let k = 0, l = temp.length; k < l; k++) {
                    divSubList.push(temp[k]);
                }
            }
        }
        let final: any[] = [];
        for (let i = 0, len = divSubList.length; i < len; i++) {
            let attrN = divSubList[i]["attrs"];
            for (let j = 0, lens = attrN.length; j < lens; j++) {
                let myKey = attrN[j]["name"];
                let myValue = attrN[j]["value"];
                if (myKey === "id" && myValue === "main") {
                    final.push(divSubList[i]);
                }
            }
        }
        let sect: any = this.findNested(final[0], "nodeName", "section");
        let sectDivCN: any[] = [];
        for (let i = 0, len = Object.keys(sect["childNodes"]).length; i < len; i++) {
            if (sect["childNodes"][i]["nodeName"] === "div") {
                let child = sect["childNodes"][i]["childNodes"];
                for (let j = 0, lens = child.length; j < lens; j++) {
                    if (child[j]["nodeName"] === "div") {
                        sectDivCN.push(child[j]);
                        let n = 0;
                    }
                }
            }
        }
        let body: any[] = [];
        for (let i = 0, len = sectDivCN.length; i < len; i++) {
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
        for (let i = 0, len = Object.keys(cn).length; i < len; i++) {
            if (cn[i]["nodeName"] === key) {
                output.push(cn[i]);
            }
        }
        return output;
    }

    public static findHelper(obj: any, key: string): any[] {
        let output: any[] = [];
        for (let i = 0, len = Object.keys(obj).length; i < len; i++) {
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
        for (let i = 0, len = output.length; i < len; i++) {
            let cn1 = output[i]["childNodes"];
            let cn1H = this.findHelper(cn1, "td");
            for (let is = 0, lens = Object.keys(cn1H).length; is < lens; is++) {
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
        for (let i = 0, len = body.length; i < len; i++) {
            if (body[i]["nodeName"] === "div") {
                fieldContent = body[i]["childNodes"];
            }
        }
        let fCN: any[] = [];
        this.parseHelper(fieldContent, fCN, "div");
        let fCN2: any[] = [];
        this.checkAttr(fCN, "id", "building-info", fCN2);
        for (let i = 0, len = fCN[0]["childNodes"].length; i < len; i++) {
            if (fCN[0]["childNodes"][i]["nodeName"] === "h2") {
                let span = fCN[0]["childNodes"][i]["childNodes"];
                roomSection["rooms_fullname"] = span[0]["childNodes"][0]["value"];
            }
        }
        let add: any[] = [];
        this.parseHelper(fCN2, add, "div");
        for (let i = 0, len = add.length; i < len; i++) {
            let addCN = add[i]["childNodes"];
            for (let j = 0, lens = addCN.length; j < lens; j++) {
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
        for (let j = 0, lens = obj.length; j < lens; j++) {
            let objCN = obj[j]["childNodes"];
            if (obj[j]["nodeName"] === key && objCN !== undefined) {
                let objSub = obj[j]["childNodes"];
                for (let i = 0, len = objSub.length; i < len; i++) {
                    if (objSub[i]["nodeName"] === key) {
                        array.push(objSub[i]);
                    }
                }
            }
        }
    }

    public static checkAttr(obj: any[], name: string, value: string, array: any[]) {
        for (let i = 0, len = obj.length; i < len; i++) {
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

    public static parseTableHelper(tr: any[]): any[] {
        let href: any[] = [];
        let rNumber: any[] = [];
        let seats: any[] = [];
        let type: any[] = [];
        let furn: any[] = [];
        let rName: any[] = [];
        let sName: any[] = [];
        let td: any[] = [];
        for (let i = 0, len = tr.length; i < len; i++) {
            if (tr[i]["nodeName"] !== "#text") {
                let trChild = tr[i]["childNodes"];
                for (let j = 0, lens = trChild.length; j < lens; j++) {
                    let tds = trChild[j];
                    if (tds["nodeName"] !== "#text") {
                        td.push(tds);
                    }
                }
            }
        }
        for (let i = 0, len = td.length; i < len; i++) {
            let cap = td[i]["childNodes"];
            if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-number") {
                let tdA = td[i]["childNodes"];
                for (let a = 0, lens = tdA.length; a < lens; a++) {
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
                furn.push(String(cap[0]["value"]).replace("\n", ""));
            } else if (td[i]["attrs"][0]["value"] === "views-field views-field-field-room-type") {
               type.push(String(cap[0]["value"]).replace("\n", ""));
            }
        }
        let combine = [href, rNumber, seats, type, furn, rName, sName];
        return combine;
    }

    public static getHref(array: any[]): string {
        for (let i = 0, len = array.length; i < len; i++) {
            let c = array[i];
            if (array[i]["name"] === "href") {
                return array[i]["value"];
            }
        }
    }
}
