import {assetUrl} from './assetUrl.js';

// A waiting worker is applied only on the home screen. It never reloads a
// playing round or an open vocabulary/camp panel.
export class CacheManager {
  constructor(isHomeIdle){
    this.isHomeIdle=isHomeIdle;
    this.registration=null;
    this.activationRequested=false;
    this.pendingReload=false;
    this.reloadTimer=null;
  }

  start(){
    if(!import.meta.env?.PROD||typeof window==='undefined'||!navigator.serviceWorker)return;
    const launch=()=>this.register().catch(()=>{});
    if(document.readyState==='complete')launch();
    else window.addEventListener('load',launch,{once:true});
  }

  async register(){
    const serviceWorker=navigator.serviceWorker;
    let hadController=!!serviceWorker.controller;
    serviceWorker.addEventListener('controllerchange',()=>{
      if(!hadController){hadController=true;return;}
      if(this.activationRequested){this.pendingReload=true;this.check();}
    });
    const registration=await serviceWorker.register(assetUrl('service-worker.js'),{
      scope:import.meta.env.BASE_URL,updateViaCache:'none'
    });
    this.registration=registration;
    registration.addEventListener('updatefound',()=>{
      const installing=registration.installing;
      installing?.addEventListener('statechange',()=>{
        // Keep the current visit on one build. A later home boundary or next
        // visit applies this worker without resetting an animal selection.
        if(installing.state==='installed'&&serviceWorker.controller)this.updateReady=true;
      });
    });
    // A waiting update from an earlier visit can be applied before play starts.
    this.check();
    registration.update().catch(()=>{});
  }

  check(){
    if(!this.isHomeIdle?.())return;
    if(this.pendingReload){
      if(this.reloadTimer)return;
      this.reloadTimer=setTimeout(()=>{
        this.reloadTimer=null;
        if(this.pendingReload&&this.isHomeIdle?.())window.location.reload();
      },400);
      return;
    }
    if(this.activationRequested||!this.registration?.waiting)return;
    this.activationRequested=true;
    this.registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  }
}
