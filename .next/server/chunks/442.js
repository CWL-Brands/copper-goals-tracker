"use strict";exports.id=442,exports.ids=[442],exports.modules={40442:(e,t,r)=>{r.d(t,{hJ:()=>e8,v0:()=>t_,cx:()=>tT,Aj:()=>tc,sB:()=>ts,F6:()=>tE,w7:()=>tu});var n,i=r(62969);let s=()=>void 0,o=function(e){let t=[],r=0;for(let n=0;n<e.length;n++){let i=e.charCodeAt(n);i<128?t[r++]=i:(i<2048?t[r++]=i>>6|192:((64512&i)==55296&&n+1<e.length&&(64512&e.charCodeAt(n+1))==56320?(i=65536+((1023&i)<<10)+(1023&e.charCodeAt(++n)),t[r++]=i>>18|240,t[r++]=i>>12&63|128):t[r++]=i>>12|224,t[r++]=i>>6&63|128),t[r++]=63&i|128)}return t},a=function(e){let t=[],r=0,n=0;for(;r<e.length;){let i=e[r++];if(i<128)t[n++]=String.fromCharCode(i);else if(i>191&&i<224){let s=e[r++];t[n++]=String.fromCharCode((31&i)<<6|63&s)}else if(i>239&&i<365){let s=((7&i)<<18|(63&e[r++])<<12|(63&e[r++])<<6|63&e[r++])-65536;t[n++]=String.fromCharCode(55296+(s>>10)),t[n++]=String.fromCharCode(56320+(1023&s))}else{let s=e[r++],o=e[r++];t[n++]=String.fromCharCode((15&i)<<12|(63&s)<<6|63&o)}}return t.join("")},l={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();let r=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let t=0;t<e.length;t+=3){let i=e[t],s=t+1<e.length,o=s?e[t+1]:0,a=t+2<e.length,l=a?e[t+2]:0,c=i>>2,u=(3&i)<<4|o>>4,h=(15&o)<<2|l>>6,d=63&l;a||(d=64,s||(h=64)),n.push(r[c],r[u],r[h],r[d])}return n.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(o(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):a(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();let r=t?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let t=0;t<e.length;){let i=r[e.charAt(t++)],s=t<e.length?r[e.charAt(t)]:0,o=++t<e.length?r[e.charAt(t)]:64,a=++t<e.length?r[e.charAt(t)]:64;if(++t,null==i||null==s||null==o||null==a)throw new c;let l=i<<2|s>>4;if(n.push(l),64!==o){let e=s<<4&240|o>>2;if(n.push(e),64!==a){let e=o<<6&192|a;n.push(e)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class c extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}let u=function(e){try{return l.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null},h=()=>/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof global)return global;throw Error("Unable to locate global object.")})().__FIREBASE_DEFAULTS__,d=()=>{if("undefined"==typeof process||void 0===process.env)return;let e=process.env.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},p=()=>{let e;if("undefined"==typeof document)return;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}let t=e&&u(e[1]);return t&&JSON.parse(t)},f=()=>{try{return s()||h()||d()||p()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},m=e=>{var t,r;return null===(r=null===(t=f())||void 0===t?void 0:t.emulatorHosts)||void 0===r?void 0:r[e]};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function g(e){try{return(e.startsWith("http://")||e.startsWith("https://")?new URL(e).hostname:e).endsWith(".cloudworkstations.dev")}catch(e){return!1}}async function _(e){return(await fetch(e,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(){return"undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""}class v extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name="FirebaseError",Object.setPrototypeOf(this,v.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,E.prototype.create)}}class E{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){let r=t[0]||{},n=`${this.service}/${e}`,i=this.errors[e],s=i?i.replace(T,(e,t)=>{let n=r[t];return null!=n?String(n):`<${t}?>`}):"Error",o=`${this.serviceName}: ${s} (${n}).`;return new v(n,o,r)}}let T=/\{\$([^}]+)}/g;function y(e,t){if(e===t)return!0;let r=Object.keys(e),n=Object.keys(t);for(let i of r){if(!n.includes(i))return!1;let r=e[i],s=t[i];if(S(r)&&S(s)){if(!y(r,s))return!1}else if(r!==s)return!1}for(let e of n)if(!r.includes(e))return!1;return!0}function S(e){return null!==e&&"object"==typeof e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w(e){let t=[];for(let[r,n]of Object.entries(e))Array.isArray(n)?n.forEach(e=>{t.push(encodeURIComponent(r)+"="+encodeURIComponent(e))}):t.push(encodeURIComponent(r)+"="+encodeURIComponent(n));return t.length?"&"+t.join("&"):""}function R(e){let t={};return e.replace(/^\?/,"").split("&").forEach(e=>{if(e){let[r,n]=e.split("=");t[decodeURIComponent(r)]=decodeURIComponent(n)}}),t}function O(e){let t=e.indexOf("?");if(!t)return"";let r=e.indexOf("#",t);return e.substring(t,r>0?r:void 0)}class A{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(e=>{this.error(e)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let n;if(void 0===e&&void 0===t&&void 0===r)throw Error("Missing Observer.");void 0===(n=!function(e,t){if("object"!=typeof e||null===e)return!1;for(let r of t)if(r in e&&"function"==typeof e[r])return!0;return!1}(e,["next","error","complete"])?{next:e,error:t,complete:r}:e).next&&(n.next=k),void 0===n.error&&(n.error=k),void 0===n.complete&&(n.complete=k);let i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?n.error(this.finalError):n.complete()}catch(e){}}),this.observers.push(n),i}unsubscribeOne(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[e])try{t(this.observers[e])}catch(e){"undefined"!=typeof console&&console.error&&console.error(e)}})}close(e){this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function k(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function C(e){return e&&e._delegate?e._delegate:e}function N(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&0>t.indexOf(n)&&(r[n]=e[n]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var i=0,n=Object.getOwnPropertySymbols(e);i<n.length;i++)0>t.indexOf(n[i])&&Object.prototype.propertyIsEnumerable.call(e,n[i])&&(r[n[i]]=e[n[i]]);return r}Object.create,Object.create,"function"==typeof SuppressedError&&SuppressedError;class b{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let P=[];!function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"}(n||(n={}));let L={debug:n.DEBUG,verbose:n.VERBOSE,info:n.INFO,warn:n.WARN,error:n.ERROR,silent:n.SILENT},D=n.INFO,U={[n.DEBUG]:"log",[n.VERBOSE]:"log",[n.INFO]:"info",[n.WARN]:"warn",[n.ERROR]:"error"},M=(e,t,...r)=>{if(t<e.logLevel)return;let n=new Date().toISOString(),i=U[t];if(i)console[i](`[${n}]  ${e.name}:`,...r);else throw Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class F{constructor(e){this.name=e,this._logLevel=D,this._logHandler=M,this._userLogHandler=null,P.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in n))throw TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?L[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,n.DEBUG,...e),this._logHandler(this,n.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,n.VERBOSE,...e),this._logHandler(this,n.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,n.INFO,...e),this._logHandler(this,n.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,n.WARN,...e),this._logHandler(this,n.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,n.ERROR,...e),this._logHandler(this,n.ERROR,...e)}}function V(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}let H=new E("auth","Firebase",V()),x=new F("@firebase/auth");function j(e,...t){x.logLevel<=n.ERROR&&x.error(`Auth (${i.Jn}): ${e}`,...t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function W(e,...t){throw G(e,...t)}function B(e,...t){return G(e,...t)}function z(e,t,r){return new E("auth","Firebase",Object.assign(Object.assign({},V()),{[t]:r})).create(t,{appName:e.name})}function K(e){return z(e,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function G(e,...t){if("string"!=typeof e){let r=t[0],n=[...t.slice(1)];return n[0]&&(n[0].appName=e.name),e._errorFactory.create(r,...n)}return H.create(e,...t)}function $(e,t,...r){if(!e)throw G(t,...r)}function J(e){let t="INTERNAL ASSERTION FAILED: "+e;throw j(t),Error(t)}function q(){var e;return"undefined"!=typeof self&&(null===(e=self.location)||void 0===e?void 0:e.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(e,t){this.shortDelay=e,this.longDelay=t,t>e||J("Short delay should be less than long delay!"),this.isMobile="object"==typeof navigator&&"ReactNative"===navigator.product}get(){return!("undefined"!=typeof navigator&&navigator&&"onLine"in navigator&&"boolean"==typeof navigator.onLine&&("http:"===q()||"https:"===q()||function(){let e="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof e&&void 0!==e.id}()||"connection"in navigator))||navigator.onLine?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Y{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){return this.fetchImpl?this.fetchImpl:"undefined"!=typeof self&&"fetch"in self?self.fetch:"undefined"!=typeof globalThis&&globalThis.fetch?globalThis.fetch:"undefined"!=typeof fetch?fetch:void J("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){return this.headersImpl?this.headersImpl:"undefined"!=typeof self&&"Headers"in self?self.Headers:"undefined"!=typeof globalThis&&globalThis.Headers?globalThis.Headers:"undefined"!=typeof Headers?Headers:void J("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){return this.responseImpl?this.responseImpl:"undefined"!=typeof self&&"Response"in self?self.Response:"undefined"!=typeof globalThis&&globalThis.Response?globalThis.Response:"undefined"!=typeof Response?Response:void J("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Q={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"},Z=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],ee=new X(3e4,6e4);function et(e,t){return e.tenantId&&!t.tenantId?Object.assign(Object.assign({},t),{tenantId:e.tenantId}):t}async function er(e,t,r,n,i={}){return en(e,i,async()=>{let i={},s={};n&&("GET"===t?s=n:i={body:JSON.stringify(n)});let o=w(Object.assign({key:e.config.apiKey},s)).slice(1),a=await e._getAdditionalHeaders();a["Content-Type"]="application/json",e.languageCode&&(a["X-Firebase-Locale"]=e.languageCode);let l=Object.assign({method:t,headers:a},i);return"undefined"!=typeof navigator&&"Cloudflare-Workers"===navigator.userAgent||(l.referrerPolicy="no-referrer"),e.emulatorConfig&&g(e.emulatorConfig.host)&&(l.credentials="include"),Y.fetch()(await es(e,e.config.apiHost,r,o),l)})}async function en(e,t,r){e._canInitEmulator=!1;let n=Object.assign(Object.assign({},Q),t);try{let t=new eo(e),i=await Promise.race([r(),t.promise]);t.clearNetworkTimeout();let s=await i.json();if("needConfirmation"in s)throw ea(e,"account-exists-with-different-credential",s);if(i.ok&&!("errorMessage"in s))return s;{let[t,r]=(i.ok?s.errorMessage:s.error.message).split(" : ");if("FEDERATED_USER_ID_ALREADY_LINKED"===t)throw ea(e,"credential-already-in-use",s);if("EMAIL_EXISTS"===t)throw ea(e,"email-already-in-use",s);if("USER_DISABLED"===t)throw ea(e,"user-disabled",s);let o=n[t]||t.toLowerCase().replace(/[_\s]+/g,"-");if(r)throw z(e,o,r);W(e,o)}}catch(t){if(t instanceof v)throw t;W(e,"network-request-failed",{message:String(t)})}}async function ei(e,t,r,n,i={}){let s=await er(e,t,r,n,i);return"mfaPendingCredential"in s&&W(e,"multi-factor-auth-required",{_serverResponse:s}),s}async function es(e,t,r,n){let i=`${t}${r}?${n}`,s=e.config.emulator?/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e,t){e.emulator||J("Emulator should always be set here");let{url:r}=e.emulator;return t?`${r}${t.startsWith("/")?t.slice(1):t}`:r}(e.config,i):`${e.config.apiScheme}://${i}`;return Z.includes(r)&&(await e._persistenceManagerAvailable,"COOKIE"===e._getPersistenceType())?e._getPersistence()._getFinalTarget(s).toString():s}class eo{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((e,t)=>{this.timer=setTimeout(()=>t(B(this.auth,"network-request-failed")),ee.get())})}}function ea(e,t,r){let n={appName:e.name};r.email&&(n.email=r.email),r.phoneNumber&&(n.phoneNumber=r.phoneNumber);let i=B(e,t,n);return i.customData._tokenResponse=r,i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function el(e){return void 0!==e&&void 0!==e.enterprise}class ec{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],void 0===e.recaptchaKey)throw Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||0===this.recaptchaEnforcementState.length)return null;for(let t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return function(e){switch(e){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}(t.enforcementState);return null}isProviderEnabled(e){return"ENFORCE"===this.getProviderEnforcementState(e)||"AUDIT"===this.getProviderEnforcementState(e)}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eu(e,t){return er(e,"GET","/v2/recaptchaConfig",et(e,t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eh(e,t){return er(e,"POST","/v1/accounts:delete",t)}async function ed(e,t){return er(e,"POST","/v1/accounts:lookup",t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ep(e){if(e)try{let t=new Date(Number(e));if(!isNaN(t.getTime()))return t.toUTCString()}catch(e){}}async function ef(e,t=!1){let r=C(e),n=await r.getIdToken(t),i=eg(n);$(i&&i.exp&&i.auth_time&&i.iat,r.auth,"internal-error");let s="object"==typeof i.firebase?i.firebase:void 0,o=null==s?void 0:s.sign_in_provider;return{claims:i,token:n,authTime:ep(em(i.auth_time)),issuedAtTime:ep(em(i.iat)),expirationTime:ep(em(i.exp)),signInProvider:o||null,signInSecondFactor:(null==s?void 0:s.sign_in_second_factor)||null}}function em(e){return 1e3*Number(e)}function eg(e){let[t,r,n]=e.split(".");if(void 0===t||void 0===r||void 0===n)return j("JWT malformed, contained fewer than 3 sections"),null;try{let e=u(r);if(!e)return j("Failed to decode base64 JWT payload"),null;return JSON.parse(e)}catch(e){return j("Caught error parsing JWT payload as JSON",null==e?void 0:e.toString()),null}}function e_(e){let t=eg(e);return $(t,"internal-error"),$(void 0!==t.exp,"internal-error"),$(void 0!==t.iat,"internal-error"),Number(t.exp)-Number(t.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eI(e,t,r=!1){if(r)return t;try{return await t}catch(t){throw t instanceof v&&function({code:e}){return"auth/user-disabled"===e||"auth/user-token-expired"===e}(t)&&e.auth.currentUser===e&&await e.auth.signOut(),t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ev{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,null!==this.timerId&&clearTimeout(this.timerId))}getInterval(e){var t;if(!e)return this.errorBackoff=3e4,Math.max(0,(null!==(t=this.user.stsTokenManager.expirationTime)&&void 0!==t?t:0)-Date.now()-3e5);{let e=this.errorBackoff;return this.errorBackoff=Math.min(2*this.errorBackoff,96e4),e}}schedule(e=!1){if(!this.isRunning)return;let t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(null==e?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eE{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=ep(this.lastLoginAt),this.creationTime=ep(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eT(e){var t;let r=e.auth,n=await e.getIdToken(),i=await eI(e,ed(r,{idToken:n}));$(null==i?void 0:i.users.length,r,"internal-error");let s=i.users[0];e._notifyReloadListener(s);let o=(null===(t=s.providerUserInfo)||void 0===t?void 0:t.length)?eS(s.providerUserInfo):[],a=[...e.providerData.filter(e=>!o.some(t=>t.providerId===e.providerId)),...o],l=e.isAnonymous,c=!(e.email&&s.passwordHash)&&!(null==a?void 0:a.length);Object.assign(e,{uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:a,metadata:new eE(s.createdAt,s.lastLoginAt),isAnonymous:!!l&&c})}async function ey(e){let t=C(e);await eT(t),await t.auth._persistUserIfCurrent(t),t.auth._notifyListenersIfCurrent(t)}function eS(e){return e.map(e=>{var{providerId:t}=e,r=N(e,["providerId"]);return{providerId:t,uid:r.rawId||"",displayName:r.displayName||null,email:r.email||null,phoneNumber:r.phoneNumber||null,photoURL:r.photoUrl||null}})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ew(e,t){let r=await en(e,{},async()=>{let r=w({grant_type:"refresh_token",refresh_token:t}).slice(1),{tokenApiHost:n,apiKey:i}=e.config,s=await es(e,n,"/v1/token",`key=${i}`),o=await e._getAdditionalHeaders();o["Content-Type"]="application/x-www-form-urlencoded";let a={method:"POST",headers:o,body:r};return e.emulatorConfig&&g(e.emulatorConfig.host)&&(a.credentials="include"),Y.fetch()(s,a)});return{accessToken:r.access_token,expiresIn:r.expires_in,refreshToken:r.refresh_token}}async function eR(e,t){return er(e,"POST","/v2/accounts:revokeToken",et(e,t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eO{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){$(e.idToken,"internal-error"),$(void 0!==e.idToken,"internal-error"),$(void 0!==e.refreshToken,"internal-error");let t="expiresIn"in e&&void 0!==e.expiresIn?Number(e.expiresIn):e_(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){$(0!==e.length,"internal-error");let t=e_(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return t||!this.accessToken||this.isExpired?($(this.refreshToken,e,"user-token-expired"),this.refreshToken)?(await this.refresh(e,this.refreshToken),this.accessToken):null:this.accessToken}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){let{accessToken:r,refreshToken:n,expiresIn:i}=await ew(e,t);this.updateTokensAndExpiration(r,n,Number(i))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+1e3*r}static fromJSON(e,t){let{refreshToken:r,accessToken:n,expirationTime:i}=t,s=new eO;return r&&($("string"==typeof r,"internal-error",{appName:e}),s.refreshToken=r),n&&($("string"==typeof n,"internal-error",{appName:e}),s.accessToken=n),i&&($("number"==typeof i,"internal-error",{appName:e}),s.expirationTime=i),s}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new eO,this.toJSON())}_performRefresh(){return J("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eA(e,t){$("string"==typeof e||void 0===e,"internal-error",{appName:t})}class ek{constructor(e){var{uid:t,auth:r,stsTokenManager:n}=e,i=N(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new ev(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=r,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=i.displayName||null,this.email=i.email||null,this.emailVerified=i.emailVerified||!1,this.phoneNumber=i.phoneNumber||null,this.photoURL=i.photoURL||null,this.isAnonymous=i.isAnonymous||!1,this.tenantId=i.tenantId||null,this.providerData=i.providerData?[...i.providerData]:[],this.metadata=new eE(i.createdAt||void 0,i.lastLoginAt||void 0)}async getIdToken(e){let t=await eI(this,this.stsTokenManager.getToken(this.auth,e));return $(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return ef(this,e)}reload(){return ey(this)}_assign(e){this!==e&&($(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(e=>Object.assign({},e)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){let t=new ek(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){$(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await eT(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if((0,i.rh)(this.auth.app))return Promise.reject(K(this.auth));let e=await this.getIdToken();return await eI(this,eh(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var r,n,i,s,o,a,l,c;let u=null!==(r=t.displayName)&&void 0!==r?r:void 0,h=null!==(n=t.email)&&void 0!==n?n:void 0,d=null!==(i=t.phoneNumber)&&void 0!==i?i:void 0,p=null!==(s=t.photoURL)&&void 0!==s?s:void 0,f=null!==(o=t.tenantId)&&void 0!==o?o:void 0,m=null!==(a=t._redirectEventId)&&void 0!==a?a:void 0,g=null!==(l=t.createdAt)&&void 0!==l?l:void 0,_=null!==(c=t.lastLoginAt)&&void 0!==c?c:void 0,{uid:I,emailVerified:v,isAnonymous:E,providerData:T,stsTokenManager:y}=t;$(I&&y,e,"internal-error");let S=eO.fromJSON(this.name,y);$("string"==typeof I,e,"internal-error"),eA(u,e.name),eA(h,e.name),$("boolean"==typeof v,e,"internal-error"),$("boolean"==typeof E,e,"internal-error"),eA(d,e.name),eA(p,e.name),eA(f,e.name),eA(m,e.name),eA(g,e.name),eA(_,e.name);let w=new ek({uid:I,auth:e,email:h,emailVerified:v,displayName:u,isAnonymous:E,photoURL:p,phoneNumber:d,tenantId:f,stsTokenManager:S,createdAt:g,lastLoginAt:_});return T&&Array.isArray(T)&&(w.providerData=T.map(e=>Object.assign({},e))),m&&(w._redirectEventId=m),w}static async _fromIdTokenResponse(e,t,r=!1){let n=new eO;n.updateFromServerResponse(t);let i=new ek({uid:t.localId,auth:e,stsTokenManager:n,isAnonymous:r});return await eT(i),i}static async _fromGetAccountInfoResponse(e,t,r){let n=t.users[0];$(void 0!==n.localId,"internal-error");let i=void 0!==n.providerUserInfo?eS(n.providerUserInfo):[],s=!(n.email&&n.passwordHash)&&!(null==i?void 0:i.length),o=new eO;o.updateFromIdToken(r);let a=new ek({uid:n.localId,auth:e,stsTokenManager:o,isAnonymous:s});return Object.assign(a,{uid:n.localId,displayName:n.displayName||null,photoURL:n.photoUrl||null,email:n.email||null,emailVerified:n.emailVerified||!1,phoneNumber:n.phoneNumber||null,tenantId:n.tenantId||null,providerData:i,metadata:new eE(n.createdAt,n.lastLoginAt),isAnonymous:!(n.email&&n.passwordHash)&&!(null==i?void 0:i.length)}),a}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let eC=new Map;function eN(e){e instanceof Function||J("Expected a class definition");let t=eC.get(e);return t?t instanceof e||J("Instance stored in cache mismatched with class"):(t=new e,eC.set(e,t)),t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eb{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){let t=this.storage[e];return void 0===t?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eP(e,t,r){return`firebase:${e}:${t}:${r}`}eb.type="NONE";class eL{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;let{config:n,name:i}=this.auth;this.fullUserKey=eP(this.userKey,n.apiKey,i),this.fullPersistenceKey=eP("persistence",n.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){let e=await this.persistence._get(this.fullUserKey);if(!e)return null;if("string"==typeof e){let t=await ed(this.auth,{idToken:e}).catch(()=>void 0);return t?ek._fromGetAccountInfoResponse(this.auth,t,e):null}return ek._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;let t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new eL(eN(eb),e,r);let n=(await Promise.all(t.map(async e=>{if(await e._isAvailable())return e}))).filter(e=>e),i=n[0]||eN(eb),s=eP(r,e.config.apiKey,e.name),o=null;for(let r of t)try{let t=await r._get(s);if(t){let n;if("string"==typeof t){let r=await ed(e,{idToken:t}).catch(()=>void 0);if(!r)break;n=await ek._fromGetAccountInfoResponse(e,r,t)}else n=ek._fromJSON(e,t);r!==i&&(o=n),i=r;break}}catch(e){}let a=n.filter(e=>e._shouldAllowMigration);return i._shouldAllowMigration&&a.length&&(i=a[0],o&&await i._set(s,o.toJSON()),await Promise.all(t.map(async e=>{if(e!==i)try{await e._remove(s)}catch(e){}}))),new eL(i,e,r)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eD(e){let t=e.toLowerCase();if(t.includes("opera/")||t.includes("opr/")||t.includes("opios/"))return"Opera";if(function(e=I()){return/iemobile/i.test(e)}(t))return"IEMobile";if(t.includes("msie")||t.includes("trident/"))return"IE";{if(t.includes("edge/"))return"Edge";if(function(e=I()){return/firefox\//i.test(e)}(t))return"Firefox";if(t.includes("silk/"))return"Silk";if(function(e=I()){return/blackberry/i.test(e)}(t))return"Blackberry";if(function(e=I()){return/webos/i.test(e)}(t))return"Webos";if(function(e=I()){let t=e.toLowerCase();return t.includes("safari/")&&!t.includes("chrome/")&&!t.includes("crios/")&&!t.includes("android")}(t))return"Safari";if((t.includes("chrome/")||function(e=I()){return/crios\//i.test(e)}(t))&&!t.includes("edge/"))return"Chrome";if(function(e=I()){return/android/i.test(e)}(t))return"Android";let r=e.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/);if((null==r?void 0:r.length)===2)return r[1]}return"Other"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eU(e,t=[]){let r;switch(e){case"Browser":r=eD(I());break;case"Worker":r=`${eD(I())}-${e}`;break;default:r=e}let n=t.length?t.join(","):"FirebaseCore-web";return`${r}/JsCore/${i.Jn}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eM{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){let r=t=>new Promise((r,n)=>{try{let n=e(t);r(n)}catch(e){n(e)}});r.onAbort=t,this.queue.push(r);let n=this.queue.length-1;return()=>{this.queue[n]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;let t=[];try{for(let r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(e){for(let e of(t.reverse(),t))try{e()}catch(e){}throw this.auth._errorFactory.create("login-blocked",{originalMessage:null==e?void 0:e.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eF(e,t={}){return er(e,"GET","/v2/passwordPolicy",et(e,t))}class eV{constructor(e){var t,r,n,i;let s=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=null!==(t=s.minPasswordLength)&&void 0!==t?t:6,s.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=s.maxPasswordLength),void 0!==s.containsLowercaseCharacter&&(this.customStrengthOptions.containsLowercaseLetter=s.containsLowercaseCharacter),void 0!==s.containsUppercaseCharacter&&(this.customStrengthOptions.containsUppercaseLetter=s.containsUppercaseCharacter),void 0!==s.containsNumericCharacter&&(this.customStrengthOptions.containsNumericCharacter=s.containsNumericCharacter),void 0!==s.containsNonAlphanumericCharacter&&(this.customStrengthOptions.containsNonAlphanumericCharacter=s.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,"ENFORCEMENT_STATE_UNSPECIFIED"===this.enforcementState&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=null!==(n=null===(r=e.allowedNonAlphanumericCharacters)||void 0===r?void 0:r.join(""))&&void 0!==n?n:"",this.forceUpgradeOnSignin=null!==(i=e.forceUpgradeOnSignin)&&void 0!==i&&i,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,r,n,i,s,o;let a={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,a),this.validatePasswordCharacterOptions(e,a),a.isValid&&(a.isValid=null===(t=a.meetsMinPasswordLength)||void 0===t||t),a.isValid&&(a.isValid=null===(r=a.meetsMaxPasswordLength)||void 0===r||r),a.isValid&&(a.isValid=null===(n=a.containsLowercaseLetter)||void 0===n||n),a.isValid&&(a.isValid=null===(i=a.containsUppercaseLetter)||void 0===i||i),a.isValid&&(a.isValid=null===(s=a.containsNumericCharacter)||void 0===s||s),a.isValid&&(a.isValid=null===(o=a.containsNonAlphanumericCharacter)||void 0===o||o),a}validatePasswordLengthOptions(e,t){let r=this.customStrengthOptions.minPasswordLength,n=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),n&&(t.meetsMaxPasswordLength=e.length<=n)}validatePasswordCharacterOptions(e,t){let r;this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);for(let n=0;n<e.length;n++)r=e.charAt(n),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,n,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=n)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eH{constructor(e,t,r,n){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=n,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new ex(this),this.idTokenSubscription=new ex(this),this.beforeStateQueue=new eM(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=H,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=n.sdkClientVersion,this._persistenceManagerAvailable=new Promise(e=>this._resolvePersistenceManagerAvailable=e)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=eN(t)),this._initializationPromise=this.queue(async()=>{var r,n,i;if(!this._deleted&&(this.persistenceManager=await eL.create(this,e),null===(r=this._resolvePersistenceManagerAvailable)||void 0===r||r.call(this),!this._deleted)){if(null===(n=this._popupRedirectResolver)||void 0===n?void 0:n._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch(e){}await this.initializeCurrentUser(t),this.lastNotifiedUid=(null===(i=this.currentUser)||void 0===i?void 0:i.uid)||null,this._deleted||(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;let e=await this.assertedPersistence.getCurrentUser();if(this.currentUser||e){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{let t=await ed(this,{idToken:e}),r=await ek._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(e){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",e),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if((0,i.rh)(this.app)){let e=this.app.settings.authIdToken;return e?new Promise(t=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(e).then(t,t))}):this.directlySetCurrentUser(null)}let r=await this.assertedPersistence.getCurrentUser(),n=r,s=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();let r=null===(t=this.redirectUser)||void 0===t?void 0:t._redirectEventId,i=null==n?void 0:n._redirectEventId,o=await this.tryRedirectSignIn(e);(!r||r===i)&&(null==o?void 0:o.user)&&(n=o.user,s=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(s)try{await this.beforeStateQueue.runMiddleware(n)}catch(e){n=r,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(e))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return($(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId)?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch(e){await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await eT(e)}catch(e){if((null==e?void 0:e.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=function(){if("undefined"==typeof navigator)return null;let e=navigator;return e.languages&&e.languages[0]||e.language||null}()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if((0,i.rh)(this.app))return Promise.reject(K(this));let t=e?C(e):null;return t&&$(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&$(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return(0,i.rh)(this.app)?Promise.reject(K(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return(0,i.rh)(this.app)?Promise.reject(K(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(eN(e))})}_getRecaptchaConfig(){return null==this.tenantId?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();let t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return null===this.tenantId?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){let e=new eV(await eF(this));null===this.tenantId?this._projectPasswordPolicy=e:this._tenantPasswordPolicies[this.tenantId]=e}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new E("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{let r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){let t={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:await this.currentUser.getIdToken()};null!=this.tenantId&&(t.tenantId=this.tenantId),await eR(this,t)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:null===(e=this._currentUser)||void 0===e?void 0:e.toJSON()}}async _setRedirectUser(e,t){let r=await this.getOrInitRedirectPersistenceManager(t);return null===e?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){let t=e&&eN(e)||this._popupRedirectResolver;$(t,this,"argument-error"),this.redirectPersistenceManager=await eL.create(this,[eN(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return(this._isInitialized&&await this.queue(async()=>{}),(null===(t=this._currentUser)||void 0===t?void 0:t._redirectEventId)===e)?this._currentUser:(null===(r=this.redirectUser)||void 0===r?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);let r=null!==(t=null===(e=this.currentUser)||void 0===e?void 0:e.uid)&&void 0!==t?t:null;this.lastNotifiedUid!==r&&(this.lastNotifiedUid=r,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,n){if(this._deleted)return()=>{};let i="function"==typeof t?t:t.next.bind(t),s=!1,o=this._isInitialized?Promise.resolve():this._initializationPromise;if($(o,this,"internal-error"),o.then(()=>{s||i(this.currentUser)}),"function"==typeof t){let i=e.addObserver(t,r,n);return()=>{s=!0,i()}}{let r=e.addObserver(t);return()=>{s=!0,r()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return $(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=eU(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;let t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);let r=await (null===(e=this.heartbeatServiceProvider.getImmediate({optional:!0}))||void 0===e?void 0:e.getHeartbeatsHeader());r&&(t["X-Firebase-Client"]=r);let n=await this._getAppCheckToken();return n&&(t["X-Firebase-AppCheck"]=n),t}async _getAppCheckToken(){var e;if((0,i.rh)(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;let t=await (null===(e=this.appCheckServiceProvider.getImmediate({optional:!0}))||void 0===e?void 0:e.getToken());return(null==t?void 0:t.error)&&function(e,...t){x.logLevel<=n.WARN&&x.warn(`Auth (${i.Jn}): ${e}`,...t)}(`Error while retrieving App Check token: ${t.error}`),null==t?void 0:t.token}}class ex{constructor(e){this.auth=e,this.observer=null,this.addObserver=function(e,t){let r=new A(e,void 0);return r.subscribe.bind(r)}(e=>this.observer=e)}get next(){return $(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ej{constructor(){this.enterprise=new eW}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class eW{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}let eB="NO_RECAPTCHA";class ez{constructor(e){this.type="recaptcha-enterprise",this.auth=C(e)}async verify(e="verify",t=!1){async function r(e){if(!t){if(null==e.tenantId&&null!=e._agentRecaptchaConfig)return e._agentRecaptchaConfig.siteKey;if(null!=e.tenantId&&void 0!==e._tenantRecaptchaConfigs[e.tenantId])return e._tenantRecaptchaConfigs[e.tenantId].siteKey}return new Promise(async(t,r)=>{eu(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(n=>{if(void 0===n.recaptchaKey)r(Error("recaptcha Enterprise site key undefined"));else{let r=new ec(n);return null==e.tenantId?e._agentRecaptchaConfig=r:e._tenantRecaptchaConfigs[e.tenantId]=r,t(r.siteKey)}}).catch(e=>{r(e)})})}return this.auth.settings.appVerificationDisabledForTesting?new ej().execute("siteKey",{action:"verify"}):new Promise((n,i)=>{r(this.auth).then(r=>{if(!t&&el(window.grecaptcha))!function(t,r,n){let i=window.grecaptcha;el(i)?i.enterprise.ready(()=>{i.enterprise.execute(t,{action:e}).then(e=>{r(e)}).catch(()=>{r(eB)})}):n(Error("No reCAPTCHA enterprise script loaded."))}(r,n,i);else{i(Error("RecaptchaVerifier is only supported in browser"));return}}).catch(e=>{i(e)})})}}async function eK(e,t,r,n=!1,i=!1){let s;let o=new ez(e);if(i)s=eB;else try{s=await o.verify(r)}catch(e){s=await o.verify(r,!0)}let a=Object.assign({},t);if("mfaSmsEnrollment"===r||"mfaSmsSignIn"===r){if("phoneEnrollmentInfo"in a){let e=a.phoneEnrollmentInfo.phoneNumber,t=a.phoneEnrollmentInfo.recaptchaToken;Object.assign(a,{phoneEnrollmentInfo:{phoneNumber:e,recaptchaToken:t,captchaResponse:s,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in a){let e=a.phoneSignInInfo.recaptchaToken;Object.assign(a,{phoneSignInInfo:{recaptchaToken:e,captchaResponse:s,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return a}return n?Object.assign(a,{captchaResp:s}):Object.assign(a,{captchaResponse:s}),Object.assign(a,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(a,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),a}async function eG(e,t,r,n,i){var s,o;if("EMAIL_PASSWORD_PROVIDER"===i){if(null===(s=e._getRecaptchaConfig())||void 0===s||!s.isProviderEnabled("EMAIL_PASSWORD_PROVIDER"))return n(e,t).catch(async i=>{if("auth/missing-recaptcha-token"!==i.code)return Promise.reject(i);{console.log(`${r} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);let i=await eK(e,t,r,"getOobCode"===r);return n(e,i)}});{let i=await eK(e,t,r,"getOobCode"===r);return n(e,i)}}if("PHONE_PROVIDER"!==i)return Promise.reject(i+" provider is not supported.");if(null===(o=e._getRecaptchaConfig())||void 0===o?void 0:o.isProviderEnabled("PHONE_PROVIDER")){let i=await eK(e,t,r);return n(e,i).catch(async i=>{var s;if((null===(s=e._getRecaptchaConfig())||void 0===s?void 0:s.getProviderEnforcementState("PHONE_PROVIDER"))==="AUDIT"&&("auth/missing-recaptcha-token"===i.code||"auth/invalid-app-credential"===i.code)){console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${r} flow.`);let i=await eK(e,t,r,!1,!0);return n(e,i)}return Promise.reject(i)})}{let i=await eK(e,t,r,!1,!0);return n(e,i)}}function e$(e){let t=e.indexOf(":");return t<0?"":e.substr(0,t+1)}function eJ(e){if(!e)return null;let t=Number(e);return isNaN(t)?null:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eq{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return J("not implemented")}_getIdTokenResponse(e){return J("not implemented")}_linkToIdToken(e,t){return J("not implemented")}_getReauthenticationResolver(e){return J("not implemented")}}async function eX(e,t){return er(e,"POST","/v1/accounts:signUp",t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eY(e,t){return ei(e,"POST","/v1/accounts:signInWithPassword",et(e,t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eQ(e,t){return ei(e,"POST","/v1/accounts:signInWithEmailLink",et(e,t))}async function eZ(e,t){return ei(e,"POST","/v1/accounts:signInWithEmailLink",et(e,t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e0 extends eq{constructor(e,t,r,n=null){super("password",r),this._email=e,this._password=t,this._tenantId=n}static _fromEmailAndPassword(e,t){return new e0(e,t,"password")}static _fromEmailAndCode(e,t,r=null){return new e0(e,t,"emailLink",r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){let t="string"==typeof e?JSON.parse(e):e;if((null==t?void 0:t.email)&&(null==t?void 0:t.password)){if("password"===t.signInMethod)return this._fromEmailAndPassword(t.email,t.password);if("emailLink"===t.signInMethod)return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":return eG(e,{returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"},"signInWithPassword",eY,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return eQ(e,{email:this._email,oobCode:this._password});default:W(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":return eG(e,{idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",eX,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return eZ(e,{idToken:t,email:this._email,oobCode:this._password});default:W(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function e1(e,t){return ei(e,"POST","/v1/accounts:signInWithIdp",et(e,t))}class e2 extends eq{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){let t=new e2(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):W("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){let t="string"==typeof e?JSON.parse(e):e,{providerId:r,signInMethod:n}=t,i=N(t,["providerId","signInMethod"]);if(!r||!n)return null;let s=new e2(r,n);return s.idToken=i.idToken||void 0,s.accessToken=i.accessToken||void 0,s.secret=i.secret,s.nonce=i.nonce,s.pendingToken=i.pendingToken||null,s}_getIdTokenResponse(e){return e1(e,this.buildRequest())}_linkToIdToken(e,t){let r=this.buildRequest();return r.idToken=t,e1(e,r)}_getReauthenticationResolver(e){let t=this.buildRequest();return t.autoCreate=!1,e1(e,t)}buildRequest(){let e={requestUri:"http://localhost",returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{let t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=w(t)}return e}}class e6{constructor(e){var t,r,n,i,s,o;let a=R(O(e)),l=null!==(t=a.apiKey)&&void 0!==t?t:null,c=null!==(r=a.oobCode)&&void 0!==r?r:null,u=/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e){switch(e){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}(null!==(n=a.mode)&&void 0!==n?n:null);$(l&&c&&u,"argument-error"),this.apiKey=l,this.operation=u,this.code=c,this.continueUrl=null!==(i=a.continueUrl)&&void 0!==i?i:null,this.languageCode=null!==(s=a.lang)&&void 0!==s?s:null,this.tenantId=null!==(o=a.tenantId)&&void 0!==o?o:null}static parseLink(e){let t=function(e){let t=R(O(e)).link,r=t?R(O(t)).deep_link_id:null,n=R(O(e)).deep_link_id;return(n?R(O(n)).link:null)||n||r||t||e}(e);try{return new e6(t)}catch(e){return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e4{constructor(){this.providerId=e4.PROVIDER_ID}static credential(e,t){return e0._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){let r=e6.parseLink(t);return $(r,"argument-error"),e0._fromEmailAndCode(e,r.code,r.tenantId)}}e4.PROVIDER_ID="password",e4.EMAIL_PASSWORD_SIGN_IN_METHOD="password",e4.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e3{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e5 extends e3{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e9 extends e5{constructor(){super("facebook.com")}static credential(e){return e2._fromParams({providerId:e9.PROVIDER_ID,signInMethod:e9.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return e9.credentialFromTaggedObject(e)}static credentialFromError(e){return e9.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return e9.credential(e.oauthAccessToken)}catch(e){return null}}}e9.FACEBOOK_SIGN_IN_METHOD="facebook.com",e9.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e8 extends e5{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return e2._fromParams({providerId:e8.PROVIDER_ID,signInMethod:e8.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return e8.credentialFromTaggedObject(e)}static credentialFromError(e){return e8.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return e8.credential(t,r)}catch(e){return null}}}e8.GOOGLE_SIGN_IN_METHOD="google.com",e8.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e7 extends e5{constructor(){super("github.com")}static credential(e){return e2._fromParams({providerId:e7.PROVIDER_ID,signInMethod:e7.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return e7.credentialFromTaggedObject(e)}static credentialFromError(e){return e7.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return e7.credential(e.oauthAccessToken)}catch(e){return null}}}e7.GITHUB_SIGN_IN_METHOD="github.com",e7.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class te extends e5{constructor(){super("twitter.com")}static credential(e,t){return e2._fromParams({providerId:te.PROVIDER_ID,signInMethod:te.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return te.credentialFromTaggedObject(e)}static credentialFromError(e){return te.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return te.credential(t,r)}catch(e){return null}}}te.TWITTER_SIGN_IN_METHOD="twitter.com",te.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tt{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,n=!1){return new tt({user:await ek._fromIdTokenResponse(e,r,n),providerId:tr(r),_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){return await e._updateTokensIfNecessary(r,!0),new tt({user:e,providerId:tr(r),_tokenResponse:r,operationType:t})}}function tr(e){return e.providerId?e.providerId:"phoneNumber"in e?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tn extends v{constructor(e,t,r,n){var i;super(t.code,t.message),this.operationType=r,this.user=n,Object.setPrototypeOf(this,tn.prototype),this.customData={appName:e.name,tenantId:null!==(i=e.tenantId)&&void 0!==i?i:void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,n){return new tn(e,t,r,n)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ti(e,t,r=!1){var n,s,o,a;if((0,i.rh)(e.app))return Promise.reject(K(e));let l="signIn",c=await (n=e,s=l,o=t,("reauthenticate"===s?o._getReauthenticationResolver(n):o._getIdTokenResponse(n)).catch(e=>{if("auth/multi-factor-auth-required"===e.code)throw tn._fromErrorAndOperation(n,e,s,void 0);throw e})),u=await tt._fromIdTokenResponse(e,l,c);return r||await e._updateCurrentUser(u.user),u}async function ts(e,t){return ti(C(e),t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class to{constructor(e,t){this.factorId=e,this.uid=t.mfaEnrollmentId,this.enrollmentTime=new Date(t.enrolledAt).toUTCString(),this.displayName=t.displayName}static _fromServerResponse(e,t){return"phoneInfo"in t?ta._fromServerResponse(e,t):"totpInfo"in t?tl._fromServerResponse(e,t):W(e,"internal-error")}}class ta extends null{constructor(e){super("phone",e),this.phoneNumber=e.phoneInfo}static _fromServerResponse(e,t){return new ta(t)}}class tl extends null{constructor(e){super("totp",e)}static _fromServerResponse(e,t){return new tl(t)}}function tc(e,t,r,n){return C(e).onAuthStateChanged(t,r,n)}function tu(e){return C(e).signOut()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class th{constructor(e,t,r){this.type=e,this.credential=t,this.user=r}static _fromIdtoken(e,t){return new th("enroll",e,t)}static _fromMfaPendingCredential(e){return new th("signin",e)}toJSON(){return{multiFactorSession:{["enroll"===this.type?"idToken":"pendingCredential"]:this.credential}}}static fromJSON(e){var t,r;if(null==e?void 0:e.multiFactorSession){if(null===(t=e.multiFactorSession)||void 0===t?void 0:t.pendingCredential)return th._fromMfaPendingCredential(e.multiFactorSession.pendingCredential);if(null===(r=e.multiFactorSession)||void 0===r?void 0:r.idToken)return th._fromIdtoken(e.multiFactorSession.idToken)}return null}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class td{constructor(e,t,r){this.session=e,this.hints=t,this.signInResolver=r}static _fromError(e,t){let r=C(e),n=t.customData._serverResponse,i=(n.mfaInfo||[]).map(e=>to._fromServerResponse(r,e));$(n.mfaPendingCredential,r,"internal-error");let s=th._fromMfaPendingCredential(n.mfaPendingCredential);return new td(s,i,async e=>{let i=await e._process(r,s);delete n.mfaInfo,delete n.mfaPendingCredential;let o=Object.assign(Object.assign({},n),{idToken:i.idToken,refreshToken:i.refreshToken});switch(t.operationType){case"signIn":let a=await tt._fromIdTokenResponse(r,t.operationType,o);return await r._updateCurrentUser(a.user),a;case"reauthenticate":return $(t.user,r,"internal-error"),tt._forOperation(t.user,t.operationType,o);default:W(r,"internal-error")}})}async resolveSignIn(e){return this.signInResolver(e)}}class tp{constructor(e){this.user=e,this.enrolledFactors=[],e._onReload(t=>{t.mfaInfo&&(this.enrolledFactors=t.mfaInfo.map(t=>to._fromServerResponse(e.auth,t)))})}static _fromUser(e){return new tp(e)}async getSession(){return th._fromIdtoken(await this.user.getIdToken(),this.user)}async enroll(e,t){let r=await this.getSession(),n=await eI(this.user,e._process(this.user.auth,r,t));return await this.user._updateTokensIfNecessary(n),this.user.reload()}async unenroll(e){let t="string"==typeof e?e:e.uid,r=await this.user.getIdToken();try{var n;let e=await eI(this.user,(n=this.user.auth,er(n,"POST","/v2/accounts/mfaEnrollment:withdraw",et(n,{idToken:r,mfaEnrollmentId:t}))));this.enrolledFactors=this.enrolledFactors.filter(({uid:e})=>e!==t),await this.user._updateTokensIfNecessary(e),await this.user.reload()}catch(e){throw e}}}new WeakMap;var tf="@firebase/auth",tm="1.10.8";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tg{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),(null===(e=this.auth.currentUser)||void 0===e?void 0:e.uid)||null}async getToken(e){return(this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser)?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;let t=this.auth.onIdTokenChanged(t=>{e((null==t?void 0:t.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();let t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){$(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}function t_(e=(0,i.Mq)()){let t=(0,i.qX)(e,"auth");if(t.isInitialized())return t.getImmediate();let r=/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e,t){let r=(0,i.qX)(e,"auth");if(r.isInitialized()){let e=r.getImmediate();if(y(r.getOptions(),null!=t?t:{}))return e;W(e,"already-initialized")}return r.initialize({options:t})}(e),n=m("auth");return n&&function(e,t,r){let n=C(e);$(/^https?:\/\//.test(t),n,"invalid-emulator-scheme");let i=!!(null==r?void 0:r.disableWarnings),s=e$(t),{host:o,port:a}=function(e){let t=e$(e),r=/(\/\/)?([^?#/]+)/.exec(e.substr(t.length));if(!r)return{host:"",port:null};let n=r[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(n);if(i){let e=i[1];return{host:e,port:eJ(n.substr(e.length+1))}}{let[e,t]=n.split(":");return{host:e,port:eJ(t)}}}(t),l=null===a?"":`:${a}`,c={url:`${s}//${o}${l}/`},u=Object.freeze({host:o,port:a,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:i})});if(!n._canInitEmulator){$(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),$(y(c,n.config.emulator)&&y(u,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=c,n.emulatorConfig=u,n.settings.appVerificationDisabledForTesting=!0,g(o)?_(`${s}//${o}${l}`):i||"undefined"!=typeof console&&"function"==typeof console.info&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.")}(r,`http://${n}`),r}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Y.initialize(fetch,Headers,Response),function(e){(0,i.Xd)(new b("auth",(t,{options:r})=>{let n=t.getProvider("app").getImmediate(),i=t.getProvider("heartbeat"),s=t.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=n.options;$(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});let l=new eH(n,i,s,{apiKey:o,authDomain:a,clientPlatform:e,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:eU(e)});return function(e,t){let r=(null==t?void 0:t.persistence)||[],n=(Array.isArray(r)?r:[r]).map(eN);(null==t?void 0:t.errorMap)&&e._updateErrorMap(t.errorMap),e._initializeWithPersistence(n,null==t?void 0:t.popupRedirectResolver)}(l,r),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),(0,i.Xd)(new b("auth-internal",e=>new tg(C(e.getProvider("auth").getImmediate())),"PRIVATE").setInstantiationMode("EXPLICIT")),(0,i.KN)(tf,tm,/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e){switch(e){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}(e)),(0,i.KN)(tf,tm,"esm2017")}("Node");let tI=B("operation-not-supported-in-this-environment");async function tv(){throw tI}let tE=tv,tT=tv;eH.prototype.setPersistence=async()=>{};class ty{constructor(e){this.factorId=e}_process(e,t,r){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,r);case"signin":return this._finalizeSignIn(e,t.credential);default:return J("unexpected MultiFactorSessionType")}}}class tS{static assertionForEnrollment(e,t){return tw._fromSecret(e,t)}static assertionForSignIn(e,t){return tw._fromEnrollmentId(e,t)}static async generateSecret(e){var t,r;$(void 0!==(null===(t=e.user)||void 0===t?void 0:t.auth),"internal-error");let n=await er(r=e.user.auth,"POST","/v2/accounts/mfaEnrollment:start",et(r,{idToken:e.credential,totpEnrollmentInfo:{}}));return tR._fromStartTotpMfaEnrollmentResponse(n,e.user.auth)}}tS.FACTOR_ID="totp";class tw extends ty{constructor(e,t,r){super("totp"),this.otp=e,this.enrollmentId=t,this.secret=r}static _fromSecret(e,t){return new tw(t,void 0,e)}static _fromEnrollmentId(e,t){return new tw(t,e)}async _finalizeEnroll(e,t,r){return $(void 0!==this.secret,e,"argument-error"),er(e,"POST","/v2/accounts/mfaEnrollment:finalize",et(e,{idToken:t,displayName:r,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)}))}async _finalizeSignIn(e,t){$(void 0!==this.enrollmentId&&void 0!==this.otp,e,"argument-error");let r={verificationCode:this.otp};return er(e,"POST","/v2/accounts/mfaSignIn:finalize",et(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:r}))}}class tR{constructor(e,t,r,n,i,s,o){this.sessionInfo=s,this.auth=o,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=r,this.codeIntervalSeconds=n,this.enrollmentCompletionDeadline=i}static _fromStartTotpMfaEnrollmentResponse(e,t){return new tR(e.totpSessionInfo.sharedSecretKey,e.totpSessionInfo.hashingAlgorithm,e.totpSessionInfo.verificationCodeLength,e.totpSessionInfo.periodSec,new Date(e.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),e.totpSessionInfo.sessionInfo,t)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){var r;let n=!1;return(tO(e)||tO(t))&&(n=!0),n&&(tO(e)&&(e=(null===(r=this.auth.currentUser)||void 0===r?void 0:r.email)||"unknownuser"),tO(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}}function tO(e){return void 0===e||(null==e?void 0:e.length)===0}}};