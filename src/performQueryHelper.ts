import {InsightError} from "./controller/IInsightFacade";
import {Decimal} from "decimal.js";

export default class PerformQueryHelper {
    public static transformationFunction(result: any[], query: any, mkey: string[], skey: string[]): any[] {
        let groupKeys = query["GROUP"];
        let applyKeys = query["APPLY"];
        if (!groupKeys.length || !applyKeys.length) {
            throw new InsightError();
        }
        for (let key of groupKeys) {
            if (!mkey.includes(key) && !skey.includes(key)) {
                throw new InsightError();
            }
        }
        result = this.groupFunction(result, function (item: any) {
            let temp = [];
            for (let key of groupKeys) {
                temp.push(item[key]);
            }
            return temp;
        });
        let temp2 = [];
        for (let key of result) {
            temp2.push(this.applyFunction(applyKeys, key, mkey, skey, groupKeys));
        }
        return temp2;
    }

    public static applyFunction(applyKeys: any[], array: any[], mkey: string[],
                                skey: string[], groupKeys: string[]): object {
        let temp: any = {};
        let clone = array[0];
        for (let key of Object.keys(clone)) {
            if (groupKeys.includes(key)) {
                temp[key] = clone[key];
            }
        }
        for (let key of applyKeys) {
            let simpleKey = Object.keys(key)[0];
            let obj = Object.values(key)[0];
            let name = Object.keys(obj)[0];
            let value = Object.values(obj)[0];
            temp[simpleKey] = this.apply(name, value, array, mkey, skey, simpleKey);
        }
        return temp;
    }

    public static apply(name: any, value: any, array: any [], mkey: string[], skey: string[], key: string): any {
        if (name === "MAX" && mkey.includes(value)) {
            let acc: number = array[0][value];
            for (let num of array) {
                if (num[value] >= acc) {
                    acc = num[value];
                }
            }
            return acc;
        } else if (name === "MIN" && mkey.includes(value)) {
            let acc2: number = array[0][value];
            for (let num of array) {
                if (acc2 >= num[value]) {
                    acc2 = num[value];
                }
            }
            return acc2;
        } else if (name === "AVG" && mkey.includes(value)) {
            let total = new Decimal(0);
            for (let num of array) {
                total = total.add(num[value]);
            }
            let avg = total.toNumber() / array.length;
            return Number(avg.toFixed(2));
        } else if (name === "SUM" && mkey.includes(value)) {
            let total = new Decimal(0);
            for (let num of array) {
                total = total.add(num[value]);
            }
            return Number(total.toFixed(2));
        } else if (name === "COUNT" && (mkey.includes(value) || skey.includes(value))) {
            return array.length;
        } else {
            throw new InsightError();
        }
    }

    public static groupFunction(array: any[], f: any) {
        let groups: any = {};
        array.forEach( function (o) {
            let group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.values(groups);
    }

    public static filter(query: any, key: string, mkey: string[], skey: string[], result: any[]): any[] {
        if (!this.comparatorErrorCheck(key)) {
            throw new InsightError();
        }
        let subArray: any = [];
        let andArray: any = [];
        try {
            subArray = Object.keys(query[key]);
            andArray = query[key];
        } catch (error) {
            throw new InsightError();
        }
        if (key === "AND") {
            if (!andArray.length) {
                throw new InsightError();
            }
            for (let subKey of andArray) {
                let temp = Object.keys(subKey);
                for (let subSubKey of temp) {
                    result = this.filter(subKey, subSubKey, mkey, skey, result);
                }
            }
            return result;
        } else if (key === "OR") {
            if (!andArray.length) {
                throw new InsightError();
            }
            let r1: any = [];
            let r2: any = [];
            for (let subKey of andArray) {
                let temp = Object.keys(subKey);
                for (let subSubKey of temp) {
                    r2 = this.filter(subKey, subSubKey, mkey, skey, result);
                }
                for (let keyKey of r2) {
                    if (!r1.includes(keyKey)) {
                        r1.push(keyKey);
                    }
                }
            }
            result = r1;
            return result;
        } else if (key === "NOT") {
            return this.notComparison(subArray, result, query, mkey, skey);
        } else if (key === "GT" || key === "LT" || key === "EQ") {
            return this.mComparison(subArray, query, key, mkey, result);
        } else if (key === "IS") {
            return this.sComparison(subArray, skey, query, key, result);
        }
    }

    public static notComparison(subArray: string[], result: any[], query: any, mkey: string[], skey: string[]): any[] {
        if (subArray.length !== 1) {
            throw new InsightError();
        }
        let temp: any = [];
        temp = result;
        for (let subKey of subArray) {
            temp = this.filter(query.NOT, subKey, mkey, skey, result);
        }
        result = result.filter(function (item) {
            return !temp.includes(item);
        });
        return result;
    }

    public static mComparison(subArray: string[], query: any, key: string, mkey: string[], result: any[]): any[] {
        if (subArray.length !== 1) {
            throw new InsightError();
        }
        for (let subKey of subArray) {
            let value = query[key][subKey];
            if (!mkey.includes(subKey) || isNaN(value)) {
                throw new InsightError();
            }
            result = this.filterFunction(result, subKey, value, key);
        }
        return result;
    }

    public static sComparison(subArray: string[], skey: string[], query: any, key: string, result: any): any[] {
        if (subArray.length !== 1) {
            throw new InsightError();
        }
        for (let subKey of subArray) {
            let value = query[key][subKey];
            if (!skey.includes(subKey) || typeof value !== "string") {
                throw new InsightError();
            }
            result = this.filterFunction(result, subKey, value, key);
        }
        return result;
    }

    public static filterFunction(result: any[], subKey: any, value: any, comparator: string): any[] {
        if (comparator === "GT") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp > value;
            });
        } else if (comparator === "LT") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp < value;
            });
        } else if (comparator === "EQ") {
            return result.filter(function (el) {
                let temp = el[subKey];
                return temp === value;
            });
        } else if (comparator === "IS") {
            let input: RegExp = /^([*]?[^*]*[*]?)$/;
            if (input.test(value)) {
                return result.filter(function (el) {
                    let temp = el[subKey];
                    return new RegExp("^" + value.replace(/\*/g, ".*") + "$").test(temp);
                });
            } else {
                throw new InsightError();
            }
        }
    }

    public static comparatorErrorCheck(key: string): boolean {
        let filters = ["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"];
        return filters.includes(key);
    }
}
