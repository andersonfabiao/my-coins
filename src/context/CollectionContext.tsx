"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {repository} from "@/lib/database";
import type {Collection,CollectionItem,Settings} from "@/types";
type Context=Collection&{toggle:(id:string)=>Promise<void>;save:(item:CollectionItem)=>Promise<void>;replace:(items:CollectionItem[])=>Promise<void>;merge:(items:CollectionItem[])=>Promise<void>;clear:()=>Promise<void>;setSettings:(s:Settings)=>Promise<void>};
const C=createContext<Context|null>(null);const defaults:Settings={theme:"system",view:"list"};
export function CollectionProvider({children}:{children:React.ReactNode}){const [items,setItems]=useState(new Map<string,CollectionItem>());const [settings,setLocalSettings]=useState(defaults);
 useEffect(()=>{let active=true;Promise.all([repository.all(),repository.settings()]).then(([rows,s])=>{if(!active)return;setItems(new Map(rows.map(i=>[i.coinId,i])));setLocalSettings(s);}).catch(error=>{if(process.env.NODE_ENV==="development")console.error("[collection] Falha ao inicializar; usando dados padrão.",error);});return()=>{active=false};},[]);
 useEffect(()=>{if(typeof document!=="undefined")document.documentElement.dataset.theme=settings.theme;},[settings.theme]);
 const save=useCallback(async(item:CollectionItem)=>{const saved=await repository.save(item);setItems(p=>new Map(p).set(saved.coinId,saved));},[]);
 const toggle=useCallback(async(id:string)=>{const old=items.get(id);const owned=!old?.owned;if(typeof navigator!=="undefined"&&typeof navigator.vibrate==="function")navigator.vibrate(12);await save({...old,coinId:id,owned,quantity:owned?Math.max(1,old?.quantity??1):0,updatedAt:new Date().toISOString()});},[items,save]);
 const replace=useCallback(async(rows:CollectionItem[])=>{const saved=await repository.replaceAll(rows);setItems(new Map(saved.map(i=>[i.coinId,i])));},[]);
 const merge=useCallback(async(rows:CollectionItem[])=>{const saved=await repository.mergeAll(rows);setItems(new Map(saved.map(i=>[i.coinId,i])));},[]);
 const clear=useCallback(async()=>{await repository.clear();setItems(new Map());},[]);
 const setSettings=useCallback(async(s:Settings)=>{await repository.saveSettings(s);setLocalSettings(s);},[]);
 const value=useMemo(()=>({items,settings,toggle,save,replace,merge,clear,setSettings}),[items,settings,toggle,save,replace,merge,clear,setSettings]);return <C.Provider value={value}>{children}</C.Provider>}
export function useCollection(){const c=useContext(C);if(!c)throw new Error("CollectionProvider ausente");return c;}
