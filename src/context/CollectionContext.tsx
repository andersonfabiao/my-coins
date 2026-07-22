"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {repository} from "@/lib/database";
import type {CollectionItem,Settings} from "@/types";
type Context={items:Map<string,CollectionItem>;settings:Settings;loading:boolean;toggle:(id:string)=>Promise<void>;save:(item:CollectionItem)=>Promise<void>;replace:(items:CollectionItem[])=>Promise<void>;merge:(items:CollectionItem[])=>Promise<void>;clear:()=>Promise<void>;setSettings:(s:Settings)=>Promise<void>};
const C=createContext<Context|null>(null);const defaults:Settings={theme:"system",view:"list"};
export function CollectionProvider({children}:{children:React.ReactNode}){const [items,setItems]=useState(new Map<string,CollectionItem>());const [settings,setLocalSettings]=useState(defaults);const [loading,setLoading]=useState(true);
 useEffect(()=>{Promise.all([repository.all(),repository.settings()]).then(([rows,s])=>{setItems(new Map(rows.map(i=>[i.coinId,i])));setLocalSettings(s);}).finally(()=>setLoading(false));},[]);
 useEffect(()=>{document.documentElement.dataset.theme=settings.theme;},[settings.theme]);
 const save=useCallback(async(item:CollectionItem)=>{await repository.save(item);setItems(p=>new Map(p).set(item.coinId,item));},[]);
 const toggle=useCallback(async(id:string)=>{const old=items.get(id);const owned=!old?.owned;if(navigator.vibrate)navigator.vibrate(12);await save({...old,coinId:id,owned,quantity:owned?Math.max(1,old?.quantity??1):0,updatedAt:new Date().toISOString()});},[items,save]);
 const replace=useCallback(async(rows:CollectionItem[])=>{await repository.clear();for(const row of rows)await repository.save(row);setItems(new Map(rows.map(i=>[i.coinId,i])));},[]);
 const merge=useCallback(async(rows:CollectionItem[])=>{for(const row of rows)await repository.save(row);setItems(p=>{const n=new Map(p);rows.forEach(i=>n.set(i.coinId,i));return n;});},[]);
 const clear=useCallback(async()=>{await repository.clear();setItems(new Map());},[]);
 const setSettings=useCallback(async(s:Settings)=>{await repository.saveSettings(s);setLocalSettings(s);},[]);
 const value=useMemo(()=>({items,settings,loading,toggle,save,replace,merge,clear,setSettings}),[items,settings,loading,toggle,save,replace,merge,clear,setSettings]);return <C.Provider value={value}>{children}</C.Provider>}
export function useCollection(){const c=useContext(C);if(!c)throw new Error("CollectionProvider ausente");return c;}
