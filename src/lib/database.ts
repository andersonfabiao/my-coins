import type { CollectionItem,Settings } from "@/types";
const DB="minha-colecao-moedas", STORE="collection", SETTINGS="settings";
const fallbackSettings:Settings={theme:"system",view:"list"};
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"coinId"});if(!db.objectStoreNames.contains(SETTINGS))db.createObjectStore(SETTINGS);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function transaction<T>(store:string,mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=fn(tx.objectStore(store));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();});}
export const repository={
 async all(){return transaction<CollectionItem[]>(STORE,"readonly",s=>s.getAll());},
 async save(item:CollectionItem){await transaction<IDBValidKey>(STORE,"readwrite",s=>s.put(item));return item;},
 async remove(id:string){await transaction<undefined>(STORE,"readwrite",s=>s.delete(id));},
 async clear(){await transaction<undefined>(STORE,"readwrite",s=>s.clear());},
 async settings(){return (await transaction<Settings|undefined>(SETTINGS,"readonly",s=>s.get("app")))??fallbackSettings;},
 async saveSettings(value:Settings){await transaction<IDBValidKey>(SETTINGS,"readwrite",s=>s.put(value,"app"));return value;}
};
